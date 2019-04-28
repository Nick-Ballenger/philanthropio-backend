const db = require("../dbConfig.js");

module.exports = {
  find,
  findById,
  create,
  remove,
  update
};

async function find() {
  const donations = await db.raw(
    `select donations.id as id, donations.user_id as user_id, donations.title as title, donations.author as author, donations.price as price, donations.publisher as publisher, donations.image_url as "imageUrl", donations.description as description, (select avg(reviews.rating) from reviews where reviews.book_id = donations.id) as rating from donations left join reviews on reviews.book_id = donations.id group by donations.id order by donations.id`
  );
  if (process.env.DB_ENVIRONMENT === "production") {
    return donations.rows;
  }
  return donations;
}

async function findById(id) {
  let DonationContent = db.raw(
    `select donations.id as id, donations.user_id as user_id, users.first_name as "firstName", users.last_name as "lastName", users.username as username, users.thumbnail_url as "thumbnailUrl", donations.title as title, donations.author as author, donations.price as price, donations.publisher as publisher, donations.image_url as "imageUrl", donations.description as description, (select avg(reviews.rating) from reviews where reviews.Donation_id = ${id}) as rating from donations left join reviews on reviews.Donation_id = donations.id join users on donations.user_id = users.id where donations.id = ${id}`
  );
  let DonationReviews = db("reviews")
    .select({
      id: "reviews.id",
      review: "reviews.review",
      rating: "reviews.rating",
      username: "users.username",
      thumbnailUrl: "users.thumbnail_url"
    })
    .innerJoin("users", "reviews.user_id", "users.id")
    .where({ "reviews.Donation_id": id });
  const retrieval = await Promise.all([DonationContent, DonationReviews]);
  if (process.env.DB_ENVIRONMENT === "production") {
    if (retrieval[0].rows[0]) {
      let [content] = retrieval[0].rows;
      let reviews = retrieval[1];
      return { ...content, reviews };
    }
  }
  if (retrieval[0][0]) {
    /* This is only true if both the promise resolved AND the post exists. Checking for just the promise causes
    nonexistent posts to return an empty object and array due to my return statement returning an object by default */
    let [content] = retrieval[0];
    let reviews = retrieval[1];
    return { ...content, reviews };
  }
}

async function create(item) {
  const [id] = await db("donations")
    .insert(item)
    .returning("id");
  if (id) {
    const Donation = await findById(id);
    return Donation;
  }
}

async function remove(id) {
  const Donation = await findById(id);
  if (Donation) {
    const deleted = await db("donations")
      .where({ id })
      .del();
    if (deleted) {
      return Donation;
    }
  }
}

async function update(item, id) {
  const editedDonation = await db("donations")
    .where({ id })
    .update(item);
  if (editedDonation) {
    const Donation = await findById(id);
    return Donation;
  }
}
