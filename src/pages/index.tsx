import { useState } from "react";
import styles from "./index.module.css";
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { LoadingSpinner } from "~/components/loading";
import { toast } from "react-hot-toast";

dayjs.extend(relativeTime);

const CreatePostsWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState<string>("");
  const ctx = api.useContext();
  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: async () => {
      setInput("");
      await ctx.posts.getAll.invalidate();
    },
    onError: (error) => {
      const errorMessage = error.data?.zodError?.fieldErrors.content;

      if(errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to save post! Please try again later.");
      }
    }
  });

  if(!user) return null;

  return (<div>
    <Image className="profileImage" src={user.profileImageUrl} width={50} height={50} alt="me"/>
    <input 
      placeholder="Type something"
      type="text"
      value={input}
      onChange={(event) => {
        setInput(event.target.value);
      }}
      disabled={isPosting}
    />
    <button onClick={() => mutate({content: input})} disabled={isPosting}>Post</button>
  </div>)
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  const {author, content, createdAt, id} = props;
  return (
    <div className="post">
      <Image className="profileImage" src={author.profileImageUrl} width={50} height={50} alt="me"/>
      <div className="postData">
        <div>{content}</div>
        <span>-</span>
        { author.username &&
          <Link href={`/${author.id}`}>{`@${author.username}`}</Link>
        }
        <span>-</span>
        <Link href={`/post/${id}`}>{dayjs(createdAt).fromNow()}</Link>
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

const Home: NextPage = () => {
  const {isLoaded, isSignedIn, } = useUser();
  
  // just to start fetching early the Feed component will use the cached data
  api.posts.getAll.useQuery();
  
  if(!isLoaded) return <LoadingSpinner/>;

  return (
    <>
      <Head>
        <title>T clone</title>
        <meta name="description" content="eee" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div>
          {!isSignedIn && <SignInButton />}
          {!!isSignedIn && (<div><CreatePostsWizard/><SignOutButton/></div>)}
        </div>
        <Feed/>
      </main>
    </>
  );
};

export default Home;