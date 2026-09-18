create extension if not exists pgcrypto;

create table if not exists public.products (
 id uuid primary key default gen_random_uuid(), sku text unique not null, brand text default '', product_type text default '', product_name text not null,
 shade text default '', finish text default '', size text default '', unit text default 'piece', purchase_price numeric(12,2) default 0,
 selling_price numeric(12,2) default 0, gst_percent numeric(5,2) default 0, stock numeric(12,2) default 0 check(stock>=0),
 reorder_level numeric(12,2) default 0 check(reorder_level>=0), supplier_id uuid, barcode text default '', rack text default '', active boolean default true,
 price_basis text default '', source text default '', verified_on date, created_at timestamptz default now()
);
create table if not exists public.customers (id uuid primary key default gen_random_uuid(),shop_name text default '',customer_name text not null,phone text default '',area text default '',gstin text default '',credit_limit numeric(12,2) default 0,address text default '',created_at timestamptz default now());
create table if not exists public.suppliers (id uuid primary key default gen_random_uuid(),company_name text not null,contact_name text default '',phone text default '',email text default '',area text default '',gstin text default '',address text default '',created_at timestamptz default now());
alter table public.products drop constraint if exists products_supplier_id_fkey;
alter table public.products add constraint products_supplier_id_fkey foreign key(supplier_id) references public.suppliers(id) on delete set null;
create table if not exists public.sales (id uuid primary key default gen_random_uuid(),invoice text unique not null,customer_id uuid references public.customers(id) on delete set null,customer_name text default 'Walk-in customer',subtotal numeric(12,2) not null,discount numeric(12,2) default 0,total numeric(12,2) not null,paid numeric(12,2) default 0,due numeric(12,2) default 0,payment_method text default 'Cash',sale_date timestamptz default now(),created_at timestamptz default now());
create table if not exists public.sale_items (id uuid primary key default gen_random_uuid(),sale_id uuid not null references public.sales(id) on delete cascade,product_id uuid not null references public.products(id),product_name text not null,quantity numeric(12,2) not null check(quantity>0),unit_price numeric(12,2) not null,line_total numeric(12,2) not null);
create table if not exists public.purchases (id uuid primary key default gen_random_uuid(),invoice text unique not null,supplier_id uuid references public.suppliers(id) on delete set null,supplier_name text default 'Unknown supplier',total numeric(12,2) not null,paid numeric(12,2) default 0,due numeric(12,2) default 0,payment_method text default 'Cash',purchase_date timestamptz default now(),created_at timestamptz default now());
create table if not exists public.purchase_items (id uuid primary key default gen_random_uuid(),purchase_id uuid not null references public.purchases(id) on delete cascade,product_id uuid not null references public.products(id),product_name text not null,quantity numeric(12,2) not null check(quantity>0),unit_cost numeric(12,2) not null,line_total numeric(12,2) not null);
create table if not exists public.stock_movements (id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id),movement_type text not null check(movement_type in('PURCHASE','SALE','ADJUSTMENT')),quantity numeric(12,2) not null,reference_id uuid,balance_after numeric(12,2) not null,created_at timestamptz default now());

do $$ declare t text; begin
 foreach t in array array['products','customers','suppliers','sales','sale_items','purchases','purchase_items','stock_movements'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('drop policy if exists "authenticated access" on public.%I',t);
  execute format('create policy "authenticated access" on public.%I for all to authenticated using(true) with check(true)',t);
 end loop;
end $$;

create or replace function public.record_sale(p_customer_id uuid,p_customer_name text,p_product_id uuid,p_quantity numeric,p_discount numeric,p_paid numeric,p_payment text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p products%rowtype; s sales%rowtype; subtotal numeric; total numeric;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_quantity<=0 then raise exception 'Quantity must be positive'; end if;
 select * into p from products where id=p_product_id for update;
 if not found then raise exception 'Product not found'; end if;
 if p.stock<p_quantity then raise exception 'Insufficient stock. Available: %',p.stock; end if;
 subtotal:=p_quantity*p.selling_price; total:=greatest(0,subtotal-greatest(0,p_discount));
 if p_paid<0 or p_paid>total then raise exception 'Paid amount cannot exceed sale total'; end if;
 insert into sales(invoice,customer_id,customer_name,subtotal,discount,total,paid,due,payment_method) values('SAL-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'),p_customer_id,coalesce(nullif(p_customer_name,''),'Walk-in customer'),subtotal,greatest(0,p_discount),total,p_paid,total-p_paid,coalesce(nullif(p_payment,''),'Cash')) returning * into s;
 insert into sale_items(sale_id,product_id,product_name,quantity,unit_price,line_total) values(s.id,p.id,p.product_name,p_quantity,p.selling_price,total);
 update products set stock=stock-p_quantity where id=p.id;
 insert into stock_movements(product_id,movement_type,quantity,reference_id,balance_after) values(p.id,'SALE',-p_quantity,s.id,p.stock-p_quantity);
 return jsonb_build_object('id',s.id,'invoice',s.invoice,'total',s.total,'paid',s.paid,'due',s.due);
end $$;

create or replace function public.record_purchase(p_supplier_id uuid,p_supplier_name text,p_product_id uuid,p_quantity numeric,p_unit_cost numeric,p_paid numeric,p_payment text,p_invoice text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p products%rowtype; pu purchases%rowtype; total numeric; inv text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_quantity<=0 then raise exception 'Quantity must be positive'; end if;
 if p_unit_cost<0 then raise exception 'Unit cost cannot be negative'; end if;
 select * into p from products where id=p_product_id for update;
 if not found then raise exception 'Product not found'; end if;
 total:=p_quantity*p_unit_cost;
 if p_paid<0 or p_paid>total then raise exception 'Paid amount cannot exceed purchase total'; end if;
 inv:=coalesce(nullif(p_invoice,''),'PUR-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'));
 insert into purchases(invoice,supplier_id,supplier_name,total,paid,due,payment_method) values(inv,p_supplier_id,coalesce(nullif(p_supplier_name,''),'Unknown supplier'),total,p_paid,total-p_paid,coalesce(nullif(p_payment,''),'Cash')) returning * into pu;
 insert into purchase_items(purchase_id,product_id,product_name,quantity,unit_cost,line_total) values(pu.id,p.id,p.product_name,p_quantity,p_unit_cost,total);
 update products set stock=stock+p_quantity,purchase_price=p_unit_cost where id=p.id;
 insert into stock_movements(product_id,movement_type,quantity,reference_id,balance_after) values(p.id,'PURCHASE',p_quantity,pu.id,p.stock+p_quantity);
 return jsonb_build_object('id',pu.id,'invoice',pu.invoice,'total',pu.total,'paid',pu.paid,'due',pu.due);
end $$;
grant execute on function public.record_sale(uuid,text,uuid,numeric,numeric,numeric,text) to authenticated;
grant execute on function public.record_purchase(uuid,text,uuid,numeric,numeric,numeric,text,text) to authenticated;