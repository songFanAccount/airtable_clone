import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

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
        const table = await tx.table.create({
          data: {
            name: "Table 1",
            baseId: base.id
          }
        })
        await tx.base.update({
          where: { id: base.id },
          data: { lastOpenedTableId: table.id }
        })
        const view = await tx.view.create({
          data: {
            name: "Grid view",
            tableId: table.id
          }
        })
        await tx.table.update({
          where: { id: table.id },
          data: { lastOpenedViewId: view.id }
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
        let newTable = await tx.table.create({
          data: {
            name: input.newName,
            baseId: input.baseId
          }
        })
        await tx.base.update({
          where: {
            id: input.baseId
          },
          data: {
            lastOpenedTableId: newTable.id
          }
        })
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
    })
})