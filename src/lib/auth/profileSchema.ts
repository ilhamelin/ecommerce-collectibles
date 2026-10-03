import { z } from "zod";
const text = z.string().max(200);
const address = z.object({ id: text, label: text, fullName: text, phone: text, region: text, comuna: text, address: text, apartment: text.optional(), isDefault: z.boolean() }).strict();
const payment = z.object({ id: text, brand: z.enum(["VISA", "MASTERCARD", "WEBPAY"]), last4: z.string().regex(/^\d{4}$/), expiry: z.string().max(7), holderName: text, isDefault: z.boolean() }).strict();
/** Only editable profile fields are persisted; orders and permissions come from the server. */
export const ProfileUpdateSchema = z.object({
  id: z.string().max(128).regex(/^[^/]+$/).optional(), email: z.string().email().max(254).optional(),
  fullName: text.optional(), phone: text.optional(), rut: text.optional(),
  addresses: z.array(address).max(20).optional(), paymentMethods: z.array(payment).max(20).optional(),
  wishlist: z.array(z.string().max(128).regex(/^[^/]+$/)).max(500).optional(),
  role: z.enum(["ADMIN", "CUSTOMER"]).optional(),
});
