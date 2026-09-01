-- order_items had no SELECT policy for regular users — only "Admins can
-- view order items" existed. loadMyOrders() on the account page queries
-- order_items for the signed-in user's own orders, so a buyer's order
-- history was silently showing orders with no item names (RLS just
-- returns nothing, no error) instead of actually failing loudly.
--
-- Run this once in the Supabase SQL Editor for your project.

create policy "Users can view own order items" on public.order_items for select using (
  exists (select 1 from public.orders where id = order_items.order_id and user_id = auth.uid())
);
