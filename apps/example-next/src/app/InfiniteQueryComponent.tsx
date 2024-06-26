"use client";

import React from "react";
import { client } from "@/lib/client";

export const InfiniteQueryComponent: React.FC = () => {
    const { data, hasNextPage, fetchNextPage } = client.posts.useInfiniteQuery({
        input: {
            take: 10,
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.length > 0) {
                return lastPage[lastPage.length - 1].id + 1;
            }

            return 0;
        },
        initialPageParam: 0,
    });

    return (
        <div className="pl-4 pt-4">
            <div className="container">
                <h1 className="text-3xl font-bold mb-4">Post List</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data &&
                        data.pages.map((page, i) => (
                            <React.Fragment key={i}>
                                {page.map((post) => (
                                    <div
                                        key={post.id}
                                        className="bg-white rounded-lg overflow-hidden border border-solid border-slate-200"
                                    >
                                        <div className="p-4">
                                            <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                                            <p className="text-gray-700 mb-4">{post.content}</p>
                                            <div className="text-sm text-gray-500">
                                                <p>By {post.author}</p>
                                                <p>{new Date(post.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                </div>
                {hasNextPage && (
                    <button onClick={() => fetchNextPage()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                        Load More
                    </button>
                )}
            </div>
        </div>
    );
};
