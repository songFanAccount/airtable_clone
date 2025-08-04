import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { FieldType, FilterJoinType, FilterOperator, Prisma, PrismaClient, type Filter } from "@prisma/client"
import { faker } from '@faker-js/faker';

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

function getDefaultOperator(fieldType: FieldType) {
  return fieldType === FieldType.Text ? FilterOperator.CONTAINS : FilterOperator.GREATERTHAN
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
      await tx.cell.create({data: {
        recordId: record.id,
        fieldId,
        value: getMockData(fieldProps.name, fieldProps.type)
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
      return ctx.db.$transaction(async (tx) => {
        const base = await tx.base.create({
          data: {
            name: input.name,
            userId: ctx.session.user.id
          }
        })
        const table = await createTable(tx, "Table 1", base.id)
        await tx.base.update({
          where: { id: base.id },
          data: { lastOpenedTableId: table.id }
        })
        return tx.base.findUnique({
          where: { id: base.id },
          include: {
            tables: {
              include: {
                views: true,
              },
            },
          },
        })
      })
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
      return ctx.db.$transaction(async (tx) => {
        return createTable(tx, input.newName, input.baseId)
      })
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
  getRecords: protectedProcedure
    .input(z.object({viewId: z.string(), skip: z.number(), take: z.number()}))
    .query(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        const view = await tx.view.findUniqueOrThrow({
          where: {id: input.viewId},
          include: {
            filters: true
          }
        })
        const filters: Filter[] = view.filters
        console.log(filters)
        const totalRecordsInView = await tx.record.count({
          where: {tableId: view.tableId},
        })
        const records = await tx.record.findMany({
          where: {tableId: view.tableId},
          include: {
            cells: {
              where: {fieldId: {notIn: view.hiddenFieldIds}},
            }
          },
          orderBy: {rowNum: 'asc'},
          skip: input.skip,
          take: input.take
        })
        return {
          totalRecordsInView,
          records,
        }
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
            cellsToInsert.push({
              recordId: record.id,
              fieldId: field.id,
              value: getMockData(field.name, field.type)
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
    .input(z.object({tableId: z.string(), fieldName: z.string(), fieldType: z.string(), columnNumber: z.number()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.$transaction(async (tx) => {
        const newField = await tx.field.create({
          data: {
            name: input.fieldName,
            columnNumber: input.columnNumber,
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
    .input(z.object({cellId: z.string(), newValue: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.cell.update({
        where: {id: input.cellId},
        data: {value: input.newValue}
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
        fieldId: input.newFieldId
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
})