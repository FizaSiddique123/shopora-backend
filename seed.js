import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import products from "./data/products.js";

dotenv.config();

const seedProducts = async () => {
  try {
    await mongoose.connect("mongodb+srv://fizasiddique507_db_user:styIlz0pOp7moGhc@shopora-cluster.unib0xo.mongodb.net/?appName=shopora-cluster");

    await Product.deleteMany();
    await Product.insertMany(products);

    console.log("✅ Products seeded successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding failed", error);
    process.exit(1);
  }
};

seedProducts();
