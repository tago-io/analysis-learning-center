import { Resources, Services, Types } from "@tago-io/sdk";
import { TagoContext } from "@tago-io/sdk/src/modules/Analysis/analysis.types";

/** Account Summary
 * @param  {Object} context analysis context
 * @param  {Object} user user object with their data
 * Example: { name: 'John Doe', phone: '+1444562367', email: 'johndoe@tago.io', timezone: 'America/Chicago' }
 * @param  {Array} tags tags to be added/update in to the user
 * Example: [{ key: 'country', value: 'United States' }]
 * @return {Promise}
 */

interface UserData {
  email: string;
  name: string;
  phone?: string | number | boolean | void;
  timezone: string;
  tags?: Types.TagsObj[];
  password?: string;
}

async function updateUserAndReturnID(user_data: UserData) {
  // If got an error, try to find the user_data.
  const [user] = await Resources.run.listUsers({
    fields: ["id", "name", "phone", "company", "tags", "active", "email", "timezone"],
    filter: { email: user_data.email },
    amount: 40,
  });

  if (!user) {
    throw "Couldn`t find user data";
  }

  user.tags = user.tags?.filter((x) => user_data.tags?.find((y) => x.key !== y.key));
  user.tags = user.tags?.concat(user_data.tags || []);

  await Resources.run.userEdit(user.id as string, { tags: user_data.tags });

  return user.id;
}

async function inviteUser(context: TagoContext, user_data: UserData, domain_url: string) {
  user_data.email = user_data.email.toLowerCase();

  // Generate a Random Password
  const password = user_data.password || `A${Math.random().toString(36).slice(2, 12)}!`;

  let createError = "";
  // Try to create the user.
  const result = await Resources.run
    .userCreate({
      active: true,
      company: "",
      email: user_data.email,
      language: "en",
      name: user_data.name,
      phone: String(user_data.phone || ""),
      tags: user_data.tags,
      timezone: user_data.timezone,
      password,
    })
    .catch((error) => {
      createError = error;
      return null;
    });

  if (!result) {
    return updateUserAndReturnID(user_data).catch(() => {
      throw createError;
    });
  }

  // If success, send an email with the password
  // const emailService = new Services({ token: context.token }).email;

  // void emailService.send({
  //   to: user_data.email,
  //   template: {
  //     name: "user_registration",
  //     params: {
  //       name: user_data.name,
  //       email: user_data.email,
  //       password: password,
  //       url_platform: domain_url,
  //     },
  //   },
  // });
  // return result.user;
}

export { inviteUser };
