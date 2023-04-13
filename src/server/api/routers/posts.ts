import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({ 
      take: 100, 
      orderBy: [{ createdAt: "desc" }]
    });

    const users = (await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
    })).map(filterUserForClient);

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);

      if(!author) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Author for post not found"})
      
      return {
        ...post,
        author
      }
    });
  }),
  getPostsByUserId: publicProcedure
  .input(
    z.object({
      userId: z.string(),
    })
  ).query(({ ctx, input }) =>
    ctx.prisma.post
      .findMany({
        where: {
          authorId: input.userId,
        },
        take: 100,
        orderBy: [{ createdAt: "desc" }],
      })
  ),
  create: privateProcedure.input(
    z.object({ 
      content: z.string().min(3).max(280)
    }))
  .mutation(async ({ctx, input}) => {
    const authorId = ctx.currentUserId;

    const post = await ctx.prisma.post.create({
      data: {
        authorId,
        content: input.content,
      },
    });

    return post;
  }),
});
