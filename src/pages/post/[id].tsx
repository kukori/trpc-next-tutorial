import styles from "../index.module.css";
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import {  useUser } from "@clerk/nextjs";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { LoadingSpinner } from "~/components/loading";

dayjs.extend(relativeTime);


type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  const {author, content, createdAt} = props;
  return (
    <div className="post">
      <Image className="profileImage" src={author.profileImageUrl} width={50} height={50} alt="me"/>
      <div className="postData">
        <div>{content}</div>
        <span>-</span>
        <div>{author.username}</div>
        <span>-</span>
        <div>{dayjs(createdAt).fromNow()}</div>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading } = api.posts.getAll.useQuery();

  if(isLoading) return <LoadingSpinner/>;
  
  return (
    <div>
      {data?.map((post) => (<PostView key={post.id} {...post} />))}
    </div>
  )
}

const SinglePostPage: NextPage = () => {
  const {isLoaded } = useUser();
  
  // just to start fetching early the Feed component will use the cached data
  api.posts.getAll.useQuery();
  
  if(!isLoaded) return <LoadingSpinner/>;

  return (
    <>
      <Head>
        <title>Post</title>
      </Head>
      <main className={styles.main}>
        <Feed/>
      </main>
    </>
  );
};

export default SinglePostPage;