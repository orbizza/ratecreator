import { fetchAllTagsWithPostCount } from "@ratecreator/actions/content";
import TagComponentRendering from "./tag-component-rendering";

export const TagComponent = async () => {
  const tags = await fetchAllTagsWithPostCount();

  return <TagComponentRendering tags={tags} />;
};
