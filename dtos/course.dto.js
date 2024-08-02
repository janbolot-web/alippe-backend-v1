export const CourseDto = (courses) => {
  const coursesData = [];
  courses.forEach((course) => {
    const courseData = {
      id: course._id,
      title: course.title,
      duration: course.duration,
      price: course.price,
      previewImgUrl: course.previewImgUrl,
      createdAt: course.createdAt,
      bgImage: course.bgImage,
      // rumbleUrl: course.rumbleUrl,
    };
    coursesData.push(courseData);
  });
  return coursesData;
};

export default class UserCourseDto {
  courseId;
  modules;
  constructor(course) {
    this.courseId = course._id;
    this.modules = course.modules;
  }
}
