import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const featured = searchParams.get("featured");

  try {
    let query = db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        originalPrice: products.originalPrice,
        image: products.image,
        categoryId: products.categoryId,
        rating: products.rating,
        reviewCount: products.reviewCount,
        inStock: products.inStock,
        badge: products.badge,
        createdAt: products.createdAt,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));

    if (category) {
      query = query.where(eq(categories.slug, category)) as typeof query;
    }

    if (search) {
      query = query.where(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )
      ) as typeof query;
    }

    if (featured) {
      query = query.limit(12) as typeof query;
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (error) {
    console.error("Products error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
