import React, { useEffect, useMemo, useState } from 'react'
import CommentRoot from '../Comment/Comment'
import AddComment from '../AddComment/AddComment'
import { Comment, } from '../types'
import { createWorkerFactory, useWorker } from '@shopify/react-web-worker'
import { useAppSelector } from "src/utils/hooks";

import * as CommentsWorker from './comments.worker'
import { Post_Type } from 'src/graphql'

// const createWorker = createWorkerFactory(() => import('./comments.worker'));


interface Props {
  type: Post_Type,
  id: number | string
};


export default function CommentsSection({ type, id }: Props) {
  // const worker = useWorker(createWorker);
  // const commentsTree = useMemo(() => convertCommentsToTree(comments), [comments])

  const [commentsTree, setCommentsTree] = useState<Comment[]>([])
  const user = useAppSelector(state => state.user.me)
  const filter = useMemo(() => `boltfun ${type}_comment ${id}` + (process.env.NODE_ENV === 'development' ? 'dev' : ""), [id, type])

  useEffect(() => {
    CommentsWorker.connect();
    const unsub = CommentsWorker.sub(filter, (newComments) => {
      setCommentsTree(newComments)
    })

    return () => {
      unsub();
    }
  }, [filter]);

  const handleNewComment = (content: string, parentId?: string) => {
    CommentsWorker.post({ content, filter, parentId });
  }


  return (
    <div className="border border-gray-200 rounded-10 p-32 bg-white">
      <h6 className="text-body2 font-bolder">Discussion</h6>
      {!!user && <div className="mt-24">
        <AddComment
          placeholder='Leave a comment...'
          onSubmit={content => handleNewComment(content)}
          avatar={user.avatar}
        />
      </div>}
      <div className='flex flex-col gap-16 mt-32'>
        {commentsTree.map(comment =>
          <CommentRoot
            key={comment.id}
            comment={comment}
            isRoot
            canReply={!!user}
            onReply={content => handleNewComment(content, comment.id.toString())}
          />)}
      </div>
    </div>
  )
}
