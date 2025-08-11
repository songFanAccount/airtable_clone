import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { $Enums, FieldType, FilterJoinType, FilterOperator, type Prisma, type PrismaClient, SortOperator, type Filter } from "@prisma/client"
import { faker } from '@faker-js/faker';
import type { RecordData } from "~/app/_components/basePage/BasePage";
import { nanoid } from "nanoid";
import pLimit from 'p-limit'
const limit = pLimit(5)

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

// function generateCellWhereCondition(filter: FilterWithField): Prisma.CellWhereInput {
//   const { type } = filter.field
//   const { operator, compareVal } = filter
//   if (type === FieldType.Text) {
//     let condition: Prisma.StringFilter<"Cell"> = {equals: ""}
//     switch (operator) {
//       case FilterOperator.CONTAINS:
//         condition = {contains: compareVal}
//         break;
//       case FilterOperator.NOTCONTAINS:
//         condition = { not: { contains: compareVal}}
//         break;
//       case FilterOperator.EQUALTO:
//         condition = { equals: compareVal }
//         break;
//       case FilterOperator.NOTEMPTY:
//         condition = { not: {equals: ""}}
//         break;
//       default:
//         break
//     }
//     return {value: condition}
//   } else {
//     let condition: Prisma.FloatNullableFilter<"Cell"> = { gt: Number(compareVal) }
//     switch (operator) {
//       case FilterOperator.SMALLERTHAN:
//         condition = { lt: Number(compareVal) }
//         break;
//       default:
//         break
//     }
//     return {numValue: condition}
//   }
// }

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

export function validFilter(filter: Filter) {
  if (filter.operator === FilterOperator.EMPTY || filter.operator === FilterOperator.NOTEMPTY) return true
  return filter.compareVal !== ""
}
async function createTable(tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, newName: string, baseId: string, tableId: string, viewId: string) {
  let newTable = await tx.table.create({
    data: {
      id: tableId,
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
      id: nanoid(10),
      rowNum: i,
      tableId: newTable.id,
    }})
    const cellsData: Prisma.CellCreateManyInput[] = defaultFields.map(field => {
      const mockDataStr = getMockData(field.name, field.type)
      return {
        recordId: record.id,
        fieldId: field.id,
        value: mockDataStr,
        numValue: field.type === FieldType.Number ? Number(mockDataStr) : undefined
      } as Prisma.CellCreateManyInput
    })
    await tx.cell.createMany({data: cellsData })
  }
  const defaultView = await tx.view.create({
    data: {
      id: viewId,
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
    .input(z.object({name: z.string(), baseId: z.string(), tableId: z.string(), viewId: z.string()}))
    .mutation(async ({ ctx, input }) => {
      const tx = ctx.db;
      const base = await tx.base.create({ data: { id: input.baseId, name: input.name, userId: ctx.session.user.id } });
      const table = await createTable(ctx.db, "Table 1", base.id, input.tableId, input.viewId);
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
              views: {
                orderBy: {createdAt: 'asc'}
              },
              fields: {
                orderBy: {
                  columnNumber: 'asc'
                }
              },
              lastOpenedView: true,
            },
            orderBy: {createdAt: 'asc'}
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
    .input(z.object({baseId: z.string(), tableId: z.string(), viewId: z.string(), newName: z.string()}))
    .mutation(async ({ctx, input}) => {
      return await createTable(ctx.db, input.newName, input.baseId, input.tableId, input.viewId)
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
          where: { id: input.baseId, },
          data: { lastOpenedTableId: input.fallbackTableId }
        })
        return updatedBase
      }, {maxWait: 40000, timeout: 60000})
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
    .input(z.object({tableId: z.string(), newViewId: z.string(), newName: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.$transaction(async (tx) => {
        const newView = await tx.view.create({
          data: {
            id: input.newViewId,
            name: input.newName,
            tableId: input.tableId
          }
        })
        await tx.table.update({
          where: { id: input.tableId },
          data: { lastOpenedViewId: newView.id }
        })
        return newView
      })
    }),
  deleteView: protectedProcedure
    .input(z.object({viewId: z.string(), newViewId: z.string().optional()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.$transaction(async (tx) => {
        const deletedView = await tx.view.delete({
          where: {id: input.viewId}
        })
        if (input.newViewId) {
          return await tx.table.update({
            where: {id: deletedView.tableId},
            data: {lastOpenedViewId: input.newViewId}
          })
        }
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
    .input(z.object({tableId: z.string(), newRecordId: z.string()}))
    .mutation(async ({ctx, input}) => {
      const updatedTable = await ctx.db.table.update({
        where: { id: input.tableId },
        data: {
          recordCount: { increment: 1 },
          lastAddedRecordPos: { increment: 1 },
        },
        select: { lastAddedRecordPos: true },
      });
    
      return ctx.db.record.create({
        data: {
          id: input.newRecordId,
          rowNum: updatedTable.lastAddedRecordPos,
          tableId: input.tableId,
        },
      });
    }),
  addXRecords: protectedProcedure
    .input(z.object({tableId: z.string(), numRecords: z.number()}))
    .mutation(async ({ctx, input}) => {
      const numRecords = input.numRecords
      const table = await ctx.db.table.findUniqueOrThrow({
        where: { id: input.tableId },
        include: { fields: true },
      })
      const fields = table.fields
      const chunkSize = 5000
      const numChunks = Math.ceil(numRecords / chunkSize)
      const firstNewRowNum = table.lastAddedRecordPos + 1
      type SQLChunk = { recordSQL: string; cellSQL: string }
      const chunks: SQLChunk[] = []
      for (let i = 0; i < numChunks; i++) {
        const recordValues: string[] = []
        const cellValues: string[] = []
        for (let j = 0; j < Math.min(chunkSize, numRecords - i * chunkSize); j++) {
          const rowNum = firstNewRowNum + i * chunkSize + j
          const recordId = nanoid(10)
          recordValues.push(`('${recordId}', ${rowNum}, '${table.id}')`)
          fields.forEach((field) => {
            const rawValue = getMockData(field.name, field.type)
            if (rawValue === "") return
            const value = String(rawValue).replace(/'/g, "''")
            const numValue =
              field.type === FieldType.Number && !isNaN(Number(rawValue))
                ? Number(rawValue)
                : 'NULL'
            cellValues.push(
              `('${nanoid(10)}', '${recordId}', '${field.id}', '${value}', ${numValue})`
            )
          })
        }
        chunks.push({
          recordSQL: `
            INSERT INTO "Record" ("id", "rowNum", "tableId")
            VALUES ${recordValues.join(', ')}
          `,
          cellSQL: `
            INSERT INTO "Cell" ("id", "recordId", "fieldId", "value", "numValue")
            VALUES ${cellValues.join(', ')}
          `,
        })
      }
      await Promise.all(
        chunks.map(({ recordSQL, cellSQL }) =>
          limit(async () => {
            await ctx.db.$executeRawUnsafe(recordSQL)
            await ctx.db.$executeRawUnsafe(cellSQL)
          })
        )
      )
      await ctx.db.table.update({
        where: { id: input.tableId },
        data: {
          recordCount: { increment: numRecords },
          lastAddedRecordPos: table.lastAddedRecordPos + numRecords,
        }
      })
      return {
        count: numRecords
      }
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
    .input(z.object({cellId: z.string().optional(), recordId: z.string().optional(), fieldId: z.string().optional(), newValue: z.string(), type: z.string()}))
    .mutation(async ({ctx, input}) => {
      const type: FieldType = input.type as FieldType
      if (input.cellId) {
        const cellData: Prisma.CellUpdateInput = {value: input.newValue}
        if (type === FieldType.Number) cellData.numValue = Number(input.newValue)
        const updatedCell = await ctx.db.cell.update({
          where: {id: input.cellId},
          data: cellData
        })
        return {
          cell: updatedCell,
          isNewCell: false
        }
      } else if (input.recordId && input.fieldId) {
        const cellData: Prisma.CellUncheckedCreateInput = {value: input.newValue, recordId: input.recordId, fieldId: input.fieldId}
        if (type === FieldType.Number) cellData.numValue = Number(input.newValue)
        const createdCell = await ctx.db.cell.create({
          data: cellData
        })
        return {
          cell: createdCell,
          isNewCell: true
        }
      }
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
  updateFilters: protectedProcedure
  .input(
    z.object({
      filtersToUpdate: z.array(
        z.object({
          id: z.string(),
          fieldId: z.string().optional(),
          operator: z.nativeEnum($Enums.FilterOperator).optional(),
          joinType: z.nativeEnum($Enums.FilterJoinType).optional(),
          compareVal: z.string().optional(),
        })
      ),
      viewId: z.string(),
      createdFilters: z.array(
        z.object({
          id: z.string(),
          fieldId: z.string(),
          operator: z.nativeEnum($Enums.FilterOperator),
          joinType: z.nativeEnum($Enums.FilterJoinType),
          compareVal: z.string(),
        })
      ),
      deletedIds: z.array(z.string())
    })
  )
  .mutation(async ({ctx, input}) => {
    const filterUpdateDatum: Prisma.FilterUncheckedUpdateManyInput[] = input.filtersToUpdate.map(filter => {
      const {id, fieldId, operator, joinType, compareVal} = filter
      const filterUpdateData: Prisma.FilterUncheckedUpdateManyInput = {id}
      if (fieldId) filterUpdateData.fieldId = fieldId
      if (joinType) filterUpdateData.joinType = joinType
      if (operator) filterUpdateData.operator = operator
      if (compareVal) filterUpdateData.compareVal = compareVal
      return filterUpdateData
    })
    const filterCreateDatum: Prisma.FilterCreateManyInput[] = input.createdFilters.map(filter => {
      const {id, fieldId, operator, joinType, compareVal} = filter
      const filterCreateData: Prisma.FilterCreateManyInput = {
        id,
        viewId: input.viewId,
        fieldId,
        joinType,
        operator,
        compareVal
      }
      return filterCreateData
    })
    const promises: Prisma.PrismaPromise<Prisma.BatchPayload>[] = [];
    if (filterUpdateDatum.length > 0) {
      promises.push(
        ...filterUpdateDatum.map((data) =>
          ctx.db.filter.updateMany({
            where: { id: data.id as string },
            data
          })
        )
      );
    }
    if (filterCreateDatum.length > 0) {
      promises.push(
        ctx.db.filter.createMany({ data: filterCreateDatum })
      );
    }
    if (input.deletedIds.length > 0) {
      promises.push(
        ctx.db.filter.deleteMany({ where: { id: { in: input.deletedIds } } })
      );
    }
    await Promise.all(promises);
  }),
  updateSorts: protectedProcedure
  .input(
    z.object({
      sortsToUpdate: z.array(
        z.object({
          id: z.string(),
          fieldId: z.string().optional(),
          operator: z.nativeEnum($Enums.SortOperator).optional(),
        })
      ),
      viewId: z.string(),
      createdSorts: z.array(
        z.object({
          id: z.string(),
          fieldId: z.string(),
          operator: z.nativeEnum($Enums.SortOperator),
          createdAt: z.date()
        })
      ),
      deletedIds: z.array(z.string())
    })
  )
  .mutation(async ({ctx, input}) => {
    const sortUpdateDatum: Prisma.SortUncheckedUpdateManyInput[] = input.sortsToUpdate.map(sort => {
      const {id, fieldId, operator} = sort
      const sortUpdateData: Prisma.SortUncheckedUpdateManyInput = {id}
      if (fieldId) sortUpdateData.fieldId = fieldId
      if (operator) sortUpdateData.operator = operator
      return sortUpdateData
    })
    const sortCreateDatum: Prisma.SortCreateManyInput[] = input.createdSorts.map(sort => {
      const {id, fieldId, operator, createdAt} = sort
      const sortCreateData: Prisma.SortCreateManyInput = {
        id,
        viewId: input.viewId,
        fieldId,
        operator,
        createdAt
      }
      return sortCreateData
    })
    const promises: Prisma.PrismaPromise<Prisma.BatchPayload>[] = [];
    if (sortUpdateDatum.length > 0) {
      promises.push(
        ...sortUpdateDatum.map((data) =>
          ctx.db.sort.updateMany({
            where: { id: data.id as string },
            data
          })
        )
      );
    }
    if (sortCreateDatum.length > 0) {
      promises.push(
        ctx.db.sort.createMany({ data: sortCreateDatum })
      );
    }
    if (input.deletedIds.length > 0) {
      promises.push(
        ctx.db.sort.deleteMany({ where: { id: { in: input.deletedIds } } })
      );
    }
    await Promise.all(promises);
  }),
  getNumRecords: protectedProcedure
    .input(z.object({filtersStr: z.string()}))
    .query(async ({ ctx, input }) => {
      const countQueryStr = `
        SELECT COUNT(DISTINCT r.id) AS total_records
        FROM "Record" r
        LEFT JOIN "Cell" c ON r.id = c."recordId"
        LEFT JOIN "Field" f ON c."fieldId" = f.id
        WHERE ${input.filtersStr};
      `;
      const [result] = await ctx.db.$queryRawUnsafe<{ total_records: number }[]>(countQueryStr);
      const totalRecordsInView = Number(result?.total_records ?? 0)
      return {
        totalRecordsInView
      }
    }),
  getRecords: protectedProcedure
    .input(z.object({viewId: z.string(), skip: z.number(), take: z.number(), filtersStr: z.string(), sortsStr: z.string(), cursor: z.string().nullish()}))
    .query(async ({ ctx, input }) => {
        const page = Number(input.cursor ?? 0) || 0;
        const take = input.take;
        const skip = page * take;
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
            ) AS cells
          FROM "Record" r
          LEFT JOIN "Cell" c ON r.id = c."recordId"
          LEFT JOIN "Field" f ON c."fieldId" = f.id
          WHERE ${input.filtersStr}
          GROUP BY r.id, r."rowNum", r."tableId"
          ORDER BY ${input.sortsStr}
          LIMIT ${take}
          OFFSET ${skip};
        `;
        const records = await ctx.db.$queryRawUnsafe<RecordData[]>(queryStr, {maxWait: 2000000, timeout: 6000000});

        // TRPC
        // const filters: FilterWithField[] = view.filters.filter(filter => validFilter(filter))
        // const fieldFilters: Record<string, FilterWithField[]> = {}
        // filters.forEach(filter => {
        //   if (fieldFilters[filter.fieldId]) fieldFilters[filter.fieldId]?.push(filter)
        //   else fieldFilters[filter.fieldId] = [filter]
        // })
        // const filterConditions: Prisma.RecordWhereInput[] = []
        // for (const [fieldId, filters] of Object.entries(fieldFilters)) {
        //   if (!filters[0]) continue
        //   const andConditions: Prisma.CellWhereInput[] = []
        //   const orConditions: Prisma.CellWhereInput[] = []
        //   for (const filter of filters) {
        //     if (filter.joinType === FilterJoinType.AND)
        //       andConditions.push(generateCellWhereCondition(filter))
        //     else
        //       orConditions.push(generateCellWhereCondition(filter))
        //   }
        //   // If there are OR conditions for this field
        //   if (orConditions.length > 0) {
        //     filterConditions.push({
        //       cells: {
        //         some: {
        //           fieldId,
        //           OR: orConditions
        //         }
        //       }
        //     })
        //   }
        //   // If there are AND conditions for this field
        //   if (andConditions.length > 0) {
        //     filterConditions.push({
        //       cells: {
        //         some: {
        //           fieldId,
        //           AND: andConditions
        //         }
        //       }
        //     })
        //   }
        // }
        // const whereCond: Prisma.RecordWhereInput = {
        //   tableId: view.tableId,
        // }
        // if (filterConditions.length > 0) whereCond.OR = filterConditions
        // const totalRecordsInView = await tx.record.count({
        //   where: whereCond,
        // })

        // const records = await tx.record.findMany({
        //   where: whereCond,
        //   include: {
        //     cells: {
        //       where: {fieldId: {notIn: view.hiddenFieldIds}},
        //       include: {field: true}
        //     }
        //   },
        //   orderBy: [
        //     {rowNum: 'asc'},
        //   ],
        //   skip: input.skip,
        //   take: input.take
        // })
        return {
          records,
        }
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