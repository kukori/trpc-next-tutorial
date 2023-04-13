import styles from "./index.module.css";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import { LoadingSpinner } from "~/components/loading";
import { api } from "~/utils/api";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";

const ProfileFeed = (props: {userId: string }) => {
  const { data, isLoading } = api.posts.getPostsByUserId.useQuery({userId: props.userId});
  if(isLoading) return <LoadingSpinner/>;

  if (!data || data.length === 0) return <div>User has not posted</div>;

  return (
    <div>
      {data.map((post) => (
        <div key={post.id}>{post.content}</div>
      ))}
    </div>
  );
}

const ProfilePage: NextPage<{ userId: string }> = ({ userId }) => {
  const { data } = api.profile.getUserById.useQuery({ userId });
  if (!data) return (<div>404</div>);

  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <main className={styles.main}>
        {data.username &&
          <div>{`${data.username}'s profile`}</div>
        }
        <div>
          <Image className="profileImage" src={data.profileImageUrl} width={100} height={100} alt="me"/>
        </div>
        <ProfileFeed userId={userId} />
      </main>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const ssg = generateSSGHelper();
  
    const userId = context.params?.slug;
  
    if (typeof userId !== "string") throw new Error("no slug");

    await ssg.profile.getUserById.prefetch({ userId });
  
    return {
      props: {
        trpcState: ssg.dehydrate(),
        userId,
      },
    };
  };
  
  export const getStaticPaths = () => {
    return { paths: [], fallback: "blocking" };
  };

export default ProfilePage;