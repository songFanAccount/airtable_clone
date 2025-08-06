import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { FieldType, FilterJoinType, FilterOperator, Prisma, PrismaClient, SortOperator, type Filter } from "@prisma/client"
import { faker } from '@faker-js/faker';
import type { RecordData } from "~/app/_components/basePage/BasePage";

function getMockData(fieldName: string, type: FieldType): string {
  fieldName = fieldName.trim().toLowerCase()
  if (type === FieldType.Text) {
    const fakerField =
    fieldName === "name" ? faker.person.fullName() :
    fieldName === "address" ? faker.location.streetAddress() :
    fieldName === "note" ? faker.lorem.sentence() :
    undefined
    return fakerField ?? ""
  } else {
    const fakerField =
    fieldName === "age" ? faker.number.int({ min: 18, max: 90 }) :
    fieldName === "rank" ? faker.number.int({ min: 1, max: 1000 }) :
    undefined
    return fakerField?.toString() ?? ""
  }
}

type FilterWithField = Prisma.FilterGetPayload<{
  include: { field: true }
}>;

function generateCellWhereCondition(filter: FilterWithField): Prisma.CellWhereInput {
  const { type } = filter.field
  const { operator, compareVal } = filter
  if (type === FieldType.Text) {
    let condition: Prisma.StringFilter<"Cell"> = {equals: ""}
    switch (operator) {
      case FilterOperator.CONTAINS:
        condition = {contains: compareVal}
        break;
      case FilterOperator.NOTCONTAINS:
        condition = { not: { contains: compareVal}}
        break;
      case FilterOperator.EQUALTO:
        condition = { equals: compareVal }
        break;
      case FilterOperator.NOTEMPTY:
        condition = { not: {equals: ""}}
        break;
      default:
        break
    }
    return {value: condition}
  } else {
    let condition: Prisma.FloatNullableFilter<"Cell"> = { gt: Number(compareVal) }
    switch (operator) {
      case FilterOperator.SMALLERTHAN:
        condition = { lt: Number(compareVal) }
        break;
      default:
        break
    }
    return {numValue: condition}
  }
}

function generateCellCondStr(filter: FilterWithField): string {
  const { id } = filter.field;
  const { operator, compareVal } = filter;

  switch (filter.field.type) {
    case FieldType.Text:
      switch (operator) {
        case FilterOperator.CONTAINS:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND fc.value LIKE CONCAT('%', '${compareVal}', '%')
            )
          `;
        case FilterOperator.NOTCONTAINS:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND fc.value NOT LIKE CONCAT('%', '${compareVal}', '%')
            )
          `;
        case FilterOperator.EQUALTO:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND fc.value = '${compareVal}'
            )
          `;
        case FilterOperator.NOTEMPTY:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND fc.value IS NOT NULL
                AND fc.value <> ''
            )
          `;
        case FilterOperator.EMPTY:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND (fc.value IS NULL OR fc.value = '')
            )
          `;
        default:
          return '';
      }
    case FieldType.Number:
      switch (operator) {
        case FilterOperator.GREATERTHAN:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND fc."numValue" > ${Number(compareVal)}
            )
          `;
        default:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND fc."numValue" < ${Number(compareVal)}
            )
          `;
      }
    default:
      return '';
  }
}

function getDefaultOperator(fieldType: FieldType) {
  return fieldType === FieldType.Text ? FilterOperator.CONTAINS : FilterOperator.GREATERTHAN
}

export function validFilter(filter: Filter) {
  if (filter.operator === FilterOperator.EMPTY || filter.operator === FilterOperator.NOTEMPTY) return true
  return filter.compareVal !== ""
}
async function createTable(tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, newName: string, baseId: string) {
  let newTable = await tx.table.create({
    data: {
      name: newName,
      baseId: baseId
    }
  })
  await tx.base.update({
    where: {
      id: baseId
    },
    data: {
      lastOpenedTableId: newTable.id
    }
  })
  /* 
  Create default fields
  */
  interface FieldProps {
    name: string,
    type: FieldType,
    id?: string
  }
  const defaultFields: FieldProps[] = [
    {name: "Name", type: FieldType.Text},
    {name: "Address", type: FieldType.Text},
    {name: "Age", type: FieldType.Number},
    {name: "Rank", type: FieldType.Number},
    {name: "Note", type: FieldType.Text},
  ]
  for (const [index, fieldProps] of defaultFields.entries()) {
    const { name, type } = fieldProps;
    const newField = await tx.field.create({
      data: {
        name,
        type,
        tableId: newTable.id,
        columnNumber: index + 1
      }
    });
    if (defaultFields[index]) defaultFields[index].id = newField.id
  }
  for (let i = 1; i <= 3; i++) {
    const record = await tx.record.create({data: {
      rowNum: i,
      tableId: newTable.id,
    }})
    for (const fieldProps of defaultFields) {
      const fieldId = fieldProps.id
      if (!fieldId) continue
      const mockDataStr = getMockData(fieldProps.name, fieldProps.type)
      await tx.cell.create({data: {
        recordId: record.id,
        fieldId,
        value: mockDataStr,
        numValue: fieldProps.type === FieldType.Number ? Number(mockDataStr) : undefined
      }})
    }
  }
  const defaultView = await tx.view.create({
    data: {
      name: "Grid view",
      tableId: newTable.id,
      hiddenFieldIds: []
    }
  })
  newTable = await tx.table.update({
    where: {
      id: newTable.id
    },
    data: {
      lastOpenedViewId: defaultView.id,
      recordCount: 3,
      lastAddedRecordPos: 3
    }
  })
  return newTable
}
export const baseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({name: z.string()}))
    .mutation(async ({ ctx, input }) => {
      const tx = ctx.db;
      const base = await tx.base.create({ data: { name: input.name, userId: ctx.session.user.id } });
      const table = await createTable(ctx.db, "Table 1", base.id);
      await tx.base.update({ where: { id: base.id }, data: { lastOpenedTableId: table.id } });
      return await tx.base.findUnique({ where: { id: base.id }, include: { tables: { include: { views: true } } } });
    }),
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.base.findMany({
        where: {
          userId: ctx.session.user.id
        },
        orderBy: {
          createdAt: "desc"
        },
        include: {
          tables: {
            include: {
              lastOpenedView: true
            }
          }
        }
      })
    }),
  getAllFromBase: protectedProcedure
    .input(z.object({id: z.string()}))
    .query(async ({ctx, input}) => {
      return ctx.db.base.findUnique({
        where: {
          userId: ctx.session.user.id,
          id: input.id
        },
        include: {
          tables: {
            include: {
              views: true,
              fields: {
                orderBy: {
                  columnNumber: 'asc'
                }
              },
              lastOpenedView: true,
            },
          },
          user: true,
          lastOpenedTable: true,
        },
      })
    }),
  delete: protectedProcedure
    .input(z.object({id: z.string()}))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.base.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id
        }
      })
    }),
  rename: protectedProcedure
    .input(z.object({id: z.string(), newName: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.base.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id
        },
        data: {
          name: input.newName
        }
      })
    }),
  addNewTable: protectedProcedure
    .input(z.object({baseId: z.string(), newName: z.string()}))
    .mutation(async ({ctx, input}) => {
      return createTable(ctx.db, input.newName, input.baseId)
    }),
  deleteTable: protectedProcedure
    .input(z.object({baseId: z.string(), tableId: z.string(), fallbackTableId: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.$transaction(async (tx) => {
        await tx.table.delete({
          where: {
            id: input.tableId,
            baseId: input.baseId
          }
        })
        const updatedBase = await tx.base.update({
          where: {
            id: input.baseId,
          },
          data: {
            lastOpenedTableId: input.fallbackTableId
          }
        })
        return updatedBase
      })
    }),
  renameTable: protectedProcedure
    .input(z.object({tableId: z.string(), newName: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.table.update({
        where: {id: input.tableId},
        data: {name: input.newName}
      })
    }),
  addNewView: protectedProcedure
    .input(z.object({tableId: z.string(), newName: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.$transaction(async (tx) => {
        const newView = await tx.view.create({
          data: {
            name: input.newName,
            tableId: input.tableId
          }
        })
        await tx.table.update({
          where: {
            id: input.tableId
          },
          data: {
            lastOpenedViewId: newView.id
          }
        })
        return newView
      })
    }),
  deleteView: protectedProcedure
    .input(z.object({viewId: z.string(), isCurrentView: z.boolean()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.$transaction(async (tx) => {
        const deletedView = await tx.view.delete({
          where: {id: input.viewId}
        })
        if (!input.isCurrentView) return null
        const earliestCreatedView = await tx.view.findFirstOrThrow({
          where: {tableId: deletedView.tableId},
        })
        await tx.table.update({
          where: {id: deletedView.tableId},
          data: {lastOpenedViewId: earliestCreatedView.id}
        })
        return earliestCreatedView
      })
    }),
  renameView: protectedProcedure
    .input(z.object({viewId: z.string(), newName: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.view.update({
        where: {id: input.viewId},
        data: {name: input.newName}
      })
    }),
  getView: protectedProcedure
    .input(z.object({viewId: z.string()}))
    .query(async ({ctx, input}) => {
      return await ctx.db.view.findUnique({
        where: {id : input.viewId},
        include: {
          filters: { orderBy: { createdAt: 'asc' }},
          sorts: { orderBy: { createdAt: 'asc' }}
        }
      })
    }),
  updateViewHiddenFields: protectedProcedure
    .input(z.object({ viewId: z.string(), fieldIds: z.array(z.string()) }))
    .mutation(async ({ctx, input}) => {
      return await ctx.db.view.update({
        where: {id: input.viewId},
        data: { hiddenFieldIds: input.fieldIds }
      })
    }),
  addNewRecord: protectedProcedure
    .input(z.object({tableId: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.$transaction(async (tx) => {
        const table = await tx.table.findUniqueOrThrow({where: {id: input.tableId}})
        const fields = await tx.field.findMany({where: {tableId: table.id}})
        const rowNum = table.lastAddedRecordPos + 1
        const newRecord = await tx.record.create({data: {
          rowNum,
          tableId: table.id,
        }})
        for (const field of fields) {
          await tx.cell.create({data: {
            recordId: newRecord.id,
            fieldId: field.id,
            value: ""
          }})
        }
        await tx.table.update({
          where: {id: input.tableId},
          data: {
            recordCount: { increment: 1 },
            lastAddedRecordPos: rowNum,
          }
        })
      })
    }),
  addXRecords: protectedProcedure
    .input(z.object({tableId: z.string(), numRecords: z.number()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.$transaction(async (tx) => {
        const numRecords = input.numRecords
        const fields = await tx.field.findMany({
          where: {tableId: input.tableId}
        })
        const table = await tx.table.findUniqueOrThrow({where: {id: input.tableId}})
        const firstNewRowNum = table.lastAddedRecordPos + 1
        const createdRecords = await tx.record.createMany({
          data: Array.from({ length: numRecords }, (_, index) => {
            return {
              rowNum: firstNewRowNum + index,
              tableId: input.tableId,
            }
          })
        })
        const insertedRecords = await tx.record.findMany({
          where: {tableId: table.id},
          orderBy: {rowNum: 'desc'},
          take: createdRecords.count
        })
        const cellsToInsert: Prisma.CellCreateManyInput[] = []
        insertedRecords.forEach(record => {
          fields.forEach(field => {
            const mockDataStr = getMockData(field.name, field.type)
            cellsToInsert.push({
              recordId: record.id,
              fieldId: field.id,
              value: mockDataStr,
              numValue: Number(mockDataStr)
            })
          })
        })
        await tx.cell.createMany({data: cellsToInsert})
        await tx.table.update({
          where: { id: input.tableId },
          data: {
            recordCount: { increment: numRecords },
            lastAddedRecordPos: table.lastAddedRecordPos + createdRecords.count,
          }
        })
        return createdRecords
      }, {maxWait: 200000, timeout: 600000})
    }),
  addNewField: protectedProcedure
    .input(z.object({tableId: z.string(), fieldName: z.string(), fieldType: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.$transaction(async (tx) => {
        const largestColNum = (await tx.field.findFirstOrThrow({
          where: {tableId: input.tableId},
          orderBy: {columnNumber: 'desc'},
          select: {columnNumber: true}
        })).columnNumber
        const newField = await tx.field.create({
          data: {
            name: input.fieldName,
            columnNumber: largestColNum+1,
            tableId: input.tableId,
            type: input.fieldType === "TEXT" ? FieldType.Text : FieldType.Number
          }
        })
        const records = await tx.record.findMany({
          where: {
            tableId: input.tableId
          }
        })
        await tx.cell.createMany({data: records.map(record => ({
          recordId: record.id,
          fieldId: newField.id,
          value: ""
        }))})
        return newField
      })
    }),
  deleteField: protectedProcedure
    .input(z.object({fieldId: z.string()}))
    .mutation(async ({ctx, input}) => {
      return await ctx.db.field.delete({
        where: {id: input.fieldId}
      })
    }),
  updateCell: protectedProcedure
    .input(z.object({cellId: z.string(), newValue: z.string(), type: z.string()}))
    .mutation(async ({ctx, input}) => {
      const type: FieldType = input.type as FieldType
      return ctx.db.cell.update({
        where: {id: input.cellId},
        data: {value: input.newValue, numValue: type === FieldType.Number ? Number(input.newValue) : undefined}
      })
    }),
  deleteRecords: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      recordIds: z.array(z.string())
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const deleteEvent = await tx.record.deleteMany({
          where: {
            id: {
              in: input.recordIds
            }
          }
        })
        await tx.table.update({
          where: {id: input.tableId },
          data: {
            recordCount: { decrement: deleteEvent.count }
          }
        })
        return deleteEvent
      })
    }),
  addFilter: protectedProcedure
    .input(z.object({viewId: z.string(), fieldId: z.string(), fieldType: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.filter.create({data: {
        joinType: FilterJoinType.AND,
        viewId: input.viewId,
        fieldId: input.fieldId,
        operator: getDefaultOperator(input.fieldType as FieldType),
        compareVal: ""
      }})
    }),
  changeFilterField: protectedProcedure
    .input(z.object({filterId: z.string(), newFieldId: z.string(), newFieldType: z.string(), sameType: z.boolean()}))
    .mutation(async ({ctx, input}) => {
      const newData: Prisma.FilterUpdateInput = {
        field: {
          connect: {
            id: input.newFieldId
          }
        }
      }
      if (!input.sameType) {
        newData.compareVal = ""
        const newFieldType: FieldType = input.newFieldType as FieldType
        newData.operator = getDefaultOperator(newFieldType)
      }
      return ctx.db.filter.update({
        where: {id: input.filterId},
        data: newData
      })
    }),
  changeFilterOperator: protectedProcedure
    .input(z.object({filterId: z.string(), newOperator: z.string()}))
    .mutation(async ({ctx, input}) => {
      const newOperator = input.newOperator as FilterOperator
      const newData: Prisma.FilterUpdateInput = {
        operator: newOperator
      }
      if (newOperator === FilterOperator.EMPTY || newOperator === FilterOperator.NOTEMPTY) newData.compareVal = ""
      return ctx.db.filter.update({
        where: {id: input.filterId},
        data: newData
      })
    }),
  changeFilterJoinType: protectedProcedure
    .input(z.object({filterId: z.string(), newJoinType: z.string()}))
    .mutation(async ({ctx, input}) => {
      const newJoinType = input.newJoinType as FilterJoinType
      return ctx.db.filter.update({
        where: {id: input.filterId},
        data: {joinType: newJoinType}
      })
    }),
  changeFilterCompareVal: protectedProcedure
    .input(z.object({filterId: z.string(), newCompareVal: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.filter.update({
        where: {id: input.filterId},
        data: {compareVal: input.newCompareVal}
      })
    }),
  deleteFilter: protectedProcedure
    .input(z.object({filterId: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.filter.delete({where: {id: input.filterId}})
    }),
  addSort: protectedProcedure
    .input(z.object({viewId: z.string(), fieldId: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.sort.create({data: {
        viewId: input.viewId,
        fieldId: input.fieldId,
      }})
    }),
  changeSortField: protectedProcedure
    .input(z.object({sortId: z.string(), fieldId: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.sort.update({
        where: {id: input.sortId},
        data: {fieldId: input.fieldId}
      })
    }),
  changeSortOperator: protectedProcedure
    .input(z.object({sortId: z.string(), operator: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.sort.update({
        where: {id: input.sortId},
        data: {operator: input.operator as SortOperator}
      })
    }),
  deleteSort: protectedProcedure
    .input(z.object({sortId: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.sort.delete({where: {id: input.sortId}})
    }),
  getRecords: protectedProcedure
    .input(z.object({viewId: z.string(), skip: z.number(), take: z.number()}))
    .query(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        const view = await tx.view.findUniqueOrThrow({
          where: {id: input.viewId},
          include: {
            filters: {
              include: {field: true}
            },
            sorts: {
              include: {field: true},
              orderBy: {createdAt: 'asc'}
            }
          }
        })
        // RAWQUERY
        // const tableId = view.tableId
        // const filters: FilterWithField[] = view.filters.filter(filter => validFilter(filter))
        // const andStrs: string[] = []
        // const orStrs: string[] = []
        // for (const filter of filters) {
        //   if (filter.joinType === FilterJoinType.AND) andStrs.push(generateCellCondStr(filter))
        //   else orStrs.push(generateCellCondStr(filter))
        // }
        // const andClause = andStrs.length
        //   ? andStrs.map((str, i) => `${i > 0 ? "AND " : ""}${str}`).join(" ")
        //   : "TRUE";

        // const orClause = orStrs.length
        //   ? orStrs.map((str, i) => `${i > 0 ? "OR " : ""}${str}`).join(" ")
        //   : "";

        // let filtersStr = "";

        // if (andStrs.length && orStrs.length) {
        //   filtersStr = `
        //     (r."tableId" = '${tableId}' AND (${andClause}))
        //     OR
        //     (r."tableId" = '${tableId}' AND (${orClause}))
        //   `;
        // } else {
        //   filtersStr = andStrs.length 
        //     ? `r."tableId" = '${tableId}' AND (${andClause})`
        //     :
        //       orStrs.length
        //       ? `r."tableId" = '${tableId}' AND (${orClause})`
        //       : `r."tableId" = '${tableId}'`
        // }
        // const sorts = view.sorts
        // const sortClauses = sorts.map(
        //   sort => `
        //     (
        //       SELECT ${sort.field.type === FieldType.Number ? `NULLIF(fc."numValue", 0)` : "fc.value"}
        //       FROM "Cell" fc
        //       WHERE fc."recordId" = r.id
        //         AND fc."fieldId" = '${sort.fieldId}'
        //       LIMIT 1
        //     ) ${sort.operator === SortOperator.INCREASING ? "ASC" : "DESC"}
        //   `
        // );
        
        // const orderByClause = sortClauses.length
        //   ? `${sortClauses.join(', ')}, r."rowNum" ASC`
        //   : 'r."rowNum" ASC';

        // const countQueryStr = `
        //   SELECT COUNT(DISTINCT r.id) AS total_records
        //   FROM "Record" r
        //   INNER JOIN "Cell" c ON r.id = c."recordId"
        //   INNER JOIN "Field" f ON c."fieldId" = f.id
        //   WHERE ${filtersStr};
        // `;

        // const [result] = await tx.$queryRawUnsafe<{ total_records: number }[]>(countQueryStr);
        // const totalRecordsInView = Number(result?.total_records ?? 0)

        // const queryStr = `
        //   SELECT
        //     r.id AS id,
        //     r."tableId" AS "tableId",
        //     r."rowNum" AS "rowNum",
        //     json_agg(
        //       json_build_object(
        //         'id', c.id,
        //         'value', c.value,
        //         'fieldId', f.id,
        //         'recordId', r.id
        //       ) ORDER BY f."columnNumber"
        //     ) AS cells
        //   FROM "Record" r
        //   INNER JOIN "Cell" c ON r.id = c."recordId"
        //   INNER JOIN "Field" f ON c."fieldId" = f.id
        //   WHERE ${filtersStr}
        //   GROUP BY r.id, r."rowNum", r."tableId"
        //   ORDER BY ${orderByClause}
        //   LIMIT ${input.take}
        //   OFFSET ${input.skip};
        // `;
        // const records = await tx.$queryRawUnsafe<RecordData[]>(queryStr);

        // TRPC
        const filters: FilterWithField[] = view.filters.filter(filter => validFilter(filter))
        const fieldFilters: Record<string, FilterWithField[]> = {}
        filters.forEach(filter => {
          if (fieldFilters[filter.fieldId]) fieldFilters[filter.fieldId]?.push(filter)
          else fieldFilters[filter.fieldId] = [filter]
        })
        const filterConditions: Prisma.RecordWhereInput[] = []
        for (const [fieldId, filters] of Object.entries(fieldFilters)) {
          if (!filters[0]) continue
          const andConditions: Prisma.CellWhereInput[] = []
          const orConditions: Prisma.CellWhereInput[] = []
          for (const filter of filters) {
            if (filter.joinType === FilterJoinType.AND)
              andConditions.push(generateCellWhereCondition(filter))
            else
              orConditions.push(generateCellWhereCondition(filter))
          }
          // If there are OR conditions for this field
          if (orConditions.length > 0) {
            filterConditions.push({
              cells: {
                some: {
                  fieldId,
                  OR: orConditions
                }
              }
            })
          }
          // If there are AND conditions for this field
          if (andConditions.length > 0) {
            filterConditions.push({
              cells: {
                some: {
                  fieldId,
                  AND: andConditions
                }
              }
            })
          }
        }
        const whereCond: Prisma.RecordWhereInput = {
          tableId: view.tableId,
          OR: filterConditions
        }
        const totalRecordsInView = await tx.record.count({
          where: whereCond,
        })

        const records = await tx.record.findMany({
          where: whereCond,
          include: {
            cells: {
              where: {fieldId: {notIn: view.hiddenFieldIds}},
              include: {field: true}
            }
          },
          orderBy: [
            {rowNum: 'asc'},
            
          ],
          skip: input.skip,
          take: input.take
        })
        return {
          totalRecordsInView,
          records,
        }
      }, {maxWait: 200000, timeout: 600000})
    }),
  searchInView: protectedProcedure
    .input(z.object({viewId: z.string(), searchStr: z.string()}))
    .query(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        const view = await tx.view.findUniqueOrThrow({
          where: {id: input.viewId},
          include: {
            filters: {
              include: {field: true}
            },
            sorts: {
              include: {field: true},
              orderBy: {createdAt: 'asc'}
            }
          }
        })
        const hiddenFieldIds = view.hiddenFieldIds
        const hiddenClause = hiddenFieldIds.length
          ? `AND f.id NOT IN (${hiddenFieldIds.map(id => `'${id}'`).join(',')})`
          : '';
        const tableId = view.tableId
        const filters: FilterWithField[] = view.filters.filter(filter => validFilter(filter))
        const andStrs: string[] = []
        const orStrs: string[] = []
        for (const filter of filters) {
          if (filter.joinType === FilterJoinType.AND) andStrs.push(generateCellCondStr(filter))
          else orStrs.push(generateCellCondStr(filter))
        }
        const andClause = andStrs.length
          ? andStrs.map((str, i) => `${i > 0 ? "AND " : ""}${str}`).join(" ")
          : "TRUE";

        const orClause = orStrs.length
          ? orStrs.map((str, i) => `${i > 0 ? "OR " : ""}${str}`).join(" ")
          : "";

        let filtersStr = "";

        if (andStrs.length && orStrs.length) {
          filtersStr = `
            (r."tableId" = '${tableId}' AND (${andClause}))
            OR
            (r."tableId" = '${tableId}' AND (${orClause}))
          `;
        } else {
          filtersStr = andStrs.length 
            ? `r."tableId" = '${tableId}' AND (${andClause})`
            :
              orStrs.length
              ? `r."tableId" = '${tableId}' AND (${orClause})`
              : `r."tableId" = '${tableId}'`
        }
        const sorts = view.sorts
        const sortClauses = sorts.map(
          sort => `
            (
              SELECT ${sort.field.type === FieldType.Number ? `NULLIF(fc."numValue", 0)` : "fc.value"}
              FROM "Cell" fc
              WHERE fc."recordId" = r.id
                AND fc."fieldId" = '${sort.fieldId}'
              LIMIT 1
            ) ${sort.operator === SortOperator.INCREASING ? "ASC" : "DESC"}
          `
        );
        
        const orderByClause = sortClauses.length
          ? `${sortClauses.join(', ')}, r."rowNum" ASC`
          : 'r."rowNum" ASC';

        const queryStr = `
          SELECT
            r.id AS id,
            r."tableId" AS "tableId",
            r."rowNum" AS "rowNum",
            json_agg(
              json_build_object(
                'id', c.id,
                'value', c.value,
                'fieldId', f.id,
                'recordId', r.id
              ) ORDER BY f."columnNumber"
            ) FILTER (
              WHERE c."value" ILIKE CONCAT('%', '${input.searchStr}', '%')
              ${hiddenClause}
            )
            AS cells
          FROM "Record" r
          LEFT JOIN "Cell" c ON r.id = c."recordId"
          LEFT JOIN "Field" f ON c."fieldId" = f.id
          WHERE ${filtersStr}
          GROUP BY r.id, r."rowNum", r."tableId"
          ORDER BY ${orderByClause};
        `;
        const records = await tx.$queryRawUnsafe<RecordData[]>(queryStr);
        return {
          records,
        }
      }, {maxWait: 200000, timeout: 600000})
    }),
})