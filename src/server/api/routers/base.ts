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
              lastOpenedView: true
            }
          }
        }
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
    })
})