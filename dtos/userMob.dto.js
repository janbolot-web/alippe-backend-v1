export default class UserDtoMob {
  email;
  id;
  name;
  roles;
  courses;
  createdAt;
  updatedAt;
  avatarUrl;
  phoneNumber;
  constructor(model) {
    this.email = model.email;
    this.phoneNumber = model.phoneNumber;
    this.id = model._id;
    this.name = model.name;
    this.roles = model.roles;
    this.courses = model.courses;
    this.createdAt = model.createdAt;
    this.updatedAt = model.updatedAt;
    this.avatarUrl = model.avatarUrl;
  }
}
