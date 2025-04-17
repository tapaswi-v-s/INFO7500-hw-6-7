import React from "react";
import Head from "next/head";

type MetaHeaderProps = {
  title?: string;
  description?: string;
  image?: string;
  twitterCard?: string;
  children?: React.ReactNode;
};

export const MetaHeader = ({
  title = "Uniswap V2 UI | Web3 Assignment",
  description = "A Uniswap V2 interface built with Scaffold-ETH",
  image = "thumbnail.jpg",
  twitterCard = "summary_large_image",
  children,
}: MetaHeaderProps) => {
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000";

  return (
    <Head>
      {/* Title */}
      <title>{title}</title>
      <meta property="og:title" content={title} />
      <meta name="twitter:title" content={title} />

      {/* Description */}
      <meta name="description" content={description} />
      <meta property="og:description" content={description} />
      <meta name="twitter:description" content={description} />

      {/* Image */}
      <meta property="og:image" content={`${baseUrl}/${image}`} />
      <meta name="twitter:image" content={`${baseUrl}/${image}`} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />

      {/* Additional children */}
      {children}
    </Head>
  );
};