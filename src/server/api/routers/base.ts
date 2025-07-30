import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { FieldType, Prisma, PrismaClient } from "@prisma/client"

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
    type: FieldType
  }
  const defaultFields: FieldProps[] = [
    {name: "Name", type: FieldType.Text},
    {name: "Address", type: FieldType.Text},
    {name: "Age", type: FieldType.Number},
    {name: "Rank", type: FieldType.Number},
    {name: "Note", type: FieldType.Text},
  ]
  const fieldIds: string[] = []
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
    fieldIds.push(newField.id)
  }
  /*
  Create default records
  */
  const defaultRecord: Record<string, number | string> = {}
  fieldIds.forEach((field) => {
    defaultRecord[field] = ""
  })
  for (let i = 1; i <= 3; i++) {
    await tx.record.create({
      data: {
        tableId: newTable.id,
        position: i,
        data: defaultRecord
      }
    })
  }
  const defaultView = await tx.view.create({
    data: {
      name: "Grid view",
      tableId: newTable.id
    }
  })
  newTable = await tx.table.update({
    where: {
      id: newTable.id
    },
    data: {
      lastOpenedViewId: defaultView.id
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
              fields: true,
              records: true,
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
  addNewRecord: protectedProcedure
    .input(z.object({tableId: z.string(), fieldIds: z.array(z.string()), newPosition: z.number()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.$transaction(async (tx) => {
        const newRecordData: Record<string, string | number> = {}
        for (const fieldId of input.fieldIds) {
          newRecordData[fieldId] = ""
        }
        return await tx.record.create({
          data: {
            tableId: input.tableId,
            data: newRecordData as Prisma.JsonObject,
            position: input.newPosition
          }
        })
      })
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
        for (const record of records) {
          const newData = record.data as Prisma.JsonObject
          newData[newField.id] = ""
          await tx.record.update({
            where: { id: record.id},
            data: { data: newData }
          })
        }
      })
    }),
  deleteField: protectedProcedure
    .input(z.object({fieldId: z.string()}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.$transaction(async (tx) => {
        const deletedField = await tx.field.delete({
          where: {id: input.fieldId}
        })
        const records = await tx.record.findMany({
          where: {tableId: deletedField.tableId}
        })
        for (const record of records) {
          const updatedData = record.data as Prisma.JsonObject
          delete updatedData[deletedField.id]
          await tx.record.update({
            where: {id: record.id},
            data: {data: updatedData}
          })
        }
      })
    }),
  updateRecord: protectedProcedure
    .input(z.object({recordId: z.string(), newRecordData: z.record(z.string(), z.string())}))
    .mutation(async ({ctx, input}) => {
      return ctx.db.record.update({
        where: {
          id: input.recordId
        },
        data: {
          data: input.newRecordData
        }
      })
    })
})