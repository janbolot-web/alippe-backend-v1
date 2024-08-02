export const StoryDto = (stories) => {
  const storiesData = [];
  stories.forEach((story) => {
    const storyData = {
      items: story.items,
    };
    storiesData.push(storyData);
  });
  return storiesData;
};
