import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cartItems, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get("session_id")?.value || "default";
  try {
    const items = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        productName: products.name,
        productPrice: products.price,
        productImage: products.image,
        inStock: products.inStock,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.sessionId, sessionId));
    return NextResponse.json(items);
  } catch (error) {
    console.error("Cart error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get("session_id")?.value || "default";
  const { productId, quantity = 1 } = await request.json();
  try {
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.sessionId, sessionId), eq(cartItems.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      await db.update(cartItems).set({ quantity: existing[0].quantity + quantity }).where(eq(cartItems.id, existing[0].id));
    } else {
      await db.insert(cartItems).values({ sessionId, productId, quantity });
    }

    const response = NextResponse.json({ success: true });
    if (!request.cookies.get("session_id")) {
      response.cookies.set("session_id", "default", { httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
    }
    return response;
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { cartItemId, quantity } = await request.json();
  try {
    if (quantity <= 0) {
      await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
    } else {
      await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, cartItemId));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update cart error:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { cartItemId } = await request.json();
  try {
    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete cart error:", error);
    return NextResponse.json({ error: "Failed to delete from cart" }, { status: 500 });
  }
}
