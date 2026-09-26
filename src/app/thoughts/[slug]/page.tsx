import { articleRoute } from "@/app/_writing/article-route";

const route = articleRoute("thoughts");
export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
