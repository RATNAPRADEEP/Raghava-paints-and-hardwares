let folder=null;
const FILE='Raghava_Shop_Data.xlsx';
let db={products:[],customers:[],suppliers:[],sales:[],purchases:[]};
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(v||0));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function toast(t,err=false){$('toast').innerHTML='<div class="toast '+(err?'err':'')+'">'+esc(t)+'</div>';setTimeout(()=>$('toast').innerHTML='',3500)}
function nav(page){document.querySelectorAll('.section').forEach(x=>x.classList.toggle('show',x.id===page));document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.page===page))}
function emptyDb(){db={products:[],customers:[],suppliers:[],sales:[],purchases:[]}}
function jsonSheet(data,headers){const a=data.length?data:[Object.fromEntries(headers.map(h=>[h,'']))];return XLSX.utils.json_to_sheet(a,{header:headers})}
const headers={
Products:['ID','SKU','Name','Brand','Type','Shade','Finish','PackSize','Unit','PurchasePrice','SellingPrice','GSTPercent','Stock','ReorderLevel','Rack'],
Customers:['ID','ShopName','CustomerName','Phone','Area','GSTIN','CreditLimit','Address'],
Suppliers:['ID','CompanyName','ContactName','Phone','Email','Area','GSTIN','Address'],
Sales:['ID','Invoice','CustomerID','Customer','ProductID','Product','Quantity','UnitPrice','Discount','Total','Paid','Due','PaymentMethod','Date'],
Purchases:['ID','Invoice','SupplierID','Supplier','ProductID','Product','Quantity','UnitCost','Total','Paid','Due','PaymentMethod','Date'],
'Stock Movements':['ID','ProductID','Product','Type','Quantity','ReferenceID','Date']
};
async function writeExcel(){
 if(!folder)throw Error('Excel folder is not connected.');
 const wb=XLSX.utils.book_new();
 const p=db.products.map(x=>({ID:x.id,SKU:x.sku,Name:x.name,Brand:x.brand,Type:x.type,Shade:x.shade,Finish:x.finish,PackSize:x.packSize,Unit:x.unit,PurchasePrice:x.cost,SellingPrice:x.sell,GSTPercent:x.gst,Stock:x.stock,ReorderLevel:x.reorder,Rack:x.rack}));
 const c=db.customers.map(x=>({ID:x.id,ShopName:x.shop,CustomerName:x.name,Phone:x.phone,Area:x.area,GSTIN:x.gstin,CreditLimit:x.credit,Address:x.address}));
 const s=db.suppliers.map(x=>({ID:x.id,CompanyName:x.name,ContactName:x.contact,Phone:x.phone,Email:x.email,Area:x.area,GSTIN:x.gstin,Address:x.address}));
 const sales=db.sales.flatMap(x=>[{ID:x.id,Invoice:x.invoice,CustomerID:x.customerId,Customer:x.customer,ProductID:x.productId,Product:x.product,Quantity:x.qty,UnitPrice:x.price,Discount:x.discount,Total:x.total,Paid:x.paid,Due:x.due,PaymentMethod:x.payment,Date:x.date}]);
 const purchases=db.purchases.flatMap(x=>[{ID:x.id,Invoice:x.invoice,SupplierID:x.supplierId,Supplier:x.supplier,ProductID:x.productId,Product:x.product,Quantity:x.qty,UnitCost:x.cost,Total:x.total,Paid:x.paid,Due:x.due,PaymentMethod:x.payment,Date:x.date}]);
 const mov=[...db.sales.map(x=>({ID:uid(),ProductID:x.productId,Product:x.product,Type:'SALE',Quantity:-x.qty,ReferenceID:x.invoice,Date:x.date})),...db.purchases.map(x=>({ID:uid(),ProductID:x.productId,Product:x.product,Type:'PURCHASE',Quantity:x.qty,ReferenceID:x.invoice,Date:x.date}))];
 XLSX.utils.book_append_sheet(wb,jsonSheet(p,headers.Products),'Products');
 XLSX.utils.book_append_sheet(wb,jsonSheet(c,headers.Customers),'Customers');
 XLSX.utils.book_append_sheet(wb,jsonSheet(s,headers.Suppliers),'Suppliers');
 XLSX.utils.book_append_sheet(wb,jsonSheet(sales,headers.Sales),'Sales');
 XLSX.utils.book_append_sheet(wb,jsonSheet(purchases,headers.Purchases),'Purchases');
 XLSX.utils.book_append_sheet(wb,jsonSheet(mov,headers['Stock Movements']),'Stock Movements');
 const h=await folder.getFileHandle(FILE,{create:true}),w=await h.createWritable();await w.write(XLSX.write(wb,{bookType:'xlsx',type:'array'}));await w.close();
}
function read(wb,n){return wb.Sheets[n]?XLSX.utils.sheet_to_json(wb.Sheets[n],{defval:''}):[]}
function loadData(wb){
 db.products=read(wb,'Products').map(r=>({id:r.ID||uid(),sku:r.SKU||'',name:r.Name||r.ProductName||'',brand:r.Brand||'',type:r.Type||r.ProductType||'',shade:r.Shade||'',finish:r.Finish||'',packSize:r.PackSize||r.Size||'',unit:r.Unit||'piece',cost:+(r.PurchasePrice||0),sell:+(r.SellingPrice||r.Price||0),gst:+(r.GSTPercent||r.GST||0),stock:+(r.Stock||0),reorder:+(r.ReorderLevel||5),rack:r.Rack||''}));
 db.customers=read(wb,'Customers').map(r=>({id:r.ID||uid(),shop:r.ShopName||'',name:r.CustomerName||r.Name||'',phone:r.Phone||r.ContactNumber||'',area:r.Area||'',gstin:r.GSTIN||'',credit:+(r.CreditLimit||0),address:r.Address||''}));
 db.suppliers=read(wb,'Suppliers').map(r=>({id:r.ID||uid(),name:r.CompanyName||r.Name||'',contact:r.ContactName||'',phone:r.Phone||r.ContactNumber||'',email:r.Email||'',area:r.Area||'',gstin:r.GSTIN||'',address:r.Address||''}));
 db.sales=read(wb,'Sales').map(r=>({id:r.ID||uid(),invoice:r.Invoice||'',customerId:r.CustomerID||'',customer:r.Customer||'',productId:r.ProductID||'',product:r.Product||'',qty:+(r.Quantity||0),price:+(r.UnitPrice||r.Rate||0),discount:+(r.Discount||0),total:+(r.Total||0),paid:+(r.Paid||0),due:+(r.Due||0),payment:r.PaymentMethod||'',date:r.Date||''}));
 db.purchases=read(wb,'Purchases').map(r=>({id:r.ID||uid(),invoice:r.Invoice||'',supplierId:r.SupplierID||'',supplier:r.Supplier||'',productId:r.ProductID||'',product:r.Product||'',qty:+(r.Quantity||0),cost:+(r.UnitCost||0),total:+(r.Total||0),paid:+(r.Paid||0),due:+(r.Due||0),payment:r.PaymentMethod||'',date:r.Date||''}));
}
async function connect(){
 if(!window.isSecureContext)return toast('Open the HTTPS Vercel site. Browser folder access is blocked on an insecure page.',true);
 if(!window.showDirectoryPicker)return toast('Use Microsoft Edge or Google Chrome for this feature.',true);
 if(typeof XLSX==='undefined')return toast('Excel library failed to load. Check internet and refresh.',true);
 try{
  const chosen=await window.showDirectoryPicker({mode:'readwrite'});
  folder=chosen;
  const h=await folder.getFileHandle(FILE,{create:true}),f=await h.getFile();
  if(f.size){loadData(XLSX.read(await f.arrayBuffer(),{type:'array'}))}
  else{emptyDb();await writeExcel()}
  setConnected();render();toast('Excel storage connected.');
 }catch(e){if(e.name!=='AbortError')toast('Connection failed: '+(e.message||e.name),true)}
}
function setConnected(){$('dot').classList.add('on');$('connectionText').textContent='Excel storage connected';$('state').textContent='Connected — '+FILE;$('state').classList.add('on')}
function opts(a,placeholder){return '<option value="">'+placeholder+'</option>'+a.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name||x.shop)+'</option>').join('')}
function render(){
 $('productsCount').textContent=db.products.length;
 $('stockCount').textContent=db.products.reduce((n,p)=>n+Number(p.stock),0).toLocaleString('en-IN');
 $('inventoryValue').textContent=money(db.products.reduce((n,p)=>n+p.stock*p.cost,0));
 const today=new Date().toISOString().slice(0,10);$('todaySales').textContent=money(db.sales.filter(x=>String(x.date).slice(0,10)===today).reduce((n,x)=>n+x.total,0));
 $('lowStockCount').textContent=db.products.filter(p=>p.stock<=p.reorder).length;
 $('saleCustomer').innerHTML=opts(db.customers,'Walk-in customer');$('saleProduct').innerHTML=opts(db.products,'Choose product');$('purchaseSupplier').innerHTML=opts(db.suppliers,'Choose supplier');$('purchaseProduct').innerHTML=opts(db.products,'Choose product');
 $('productsTable').innerHTML='<table><tr><th>SKU</th><th>Product</th><th>Brand / Type</th><th>Shade</th><th>Pack</th><th>Sell</th><th>Stock</th><th>Status</th></tr>'+db.products.map(p=>'<tr><td>'+esc(p.sku)+'</td><td><b>'+esc(p.name)+'</b></td><td>'+esc(p.brand)+' / '+esc(p.type)+'</td><td>'+esc(p.shade)+'</td><td>'+esc(p.packSize)+' '+esc(p.unit)+'</td><td>'+money(p.sell)+'</td><td>'+p.stock+'</td><td><span class="pill '+(p.stock<=p.reorder?'low':'')+'">'+(p.stock<=0?'OUT':p.stock<=p.reorder?'LOW':'OK')+'</span></td></tr>').join('')+'</table>';
 $('lowStock').innerHTML=db.products.filter(p=>p.stock<=p.reorder).map(p=>'<p><b>'+esc(p.name)+'</b> — '+p.stock+' '+esc(p.unit)+'</p>').join('')||'<p>No low-stock products.</p>';
 const top={};db.sales.forEach(x=>top[x.product]=(top[x.product]||0)+x.qty);$('topProducts').innerHTML=Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>'<p><b>'+esc(x[0])+'</b> — '+x[1]+' sold</p>').join('')||'<p>No sales yet.</p>';
 $('salesTable').innerHTML='<table><tr><th>Invoice</th><th>Customer</th><th>Product</th><th>Qty</th><th>Total</th><th>Paid</th><th>Due</th></tr>'+db.sales.slice().reverse().map(x=>'<tr><td>'+esc(x.invoice)+'</td><td>'+esc(x.customer)+'</td><td>'+esc(x.product)+'</td><td>'+x.qty+'</td><td>'+money(x.total)+'</td><td>'+money(x.paid)+'</td><td>'+money(x.due)+'</td></tr>').join('')+'</table>';
 $('purchasesTable').innerHTML='<table><tr><th>Invoice</th><th>Supplier</th><th>Product</th><th>Qty</th><th>Total</th><th>Paid</th><th>Due</th></tr>'+db.purchases.slice().reverse().map(x=>'<tr><td>'+esc(x.invoice)+'</td><td>'+esc(x.supplier)+'</td><td>'+esc(x.product)+'</td><td>'+x.qty+'</td><td>'+money(x.total)+'</td><td>'+money(x.paid)+'</td><td>'+money(x.due)+'</td></tr>').join('')+'</table>';
 $('customersTable').innerHTML='<table><tr><th>Shop</th><th>Customer</th><th>Phone</th><th>Area</th></tr>'+db.customers.map(x=>'<tr><td>'+esc(x.shop)+'</td><td>'+esc(x.name)+'</td><td>'+esc(x.phone)+'</td><td>'+esc(x.area)+'</td></tr>').join('')+'</table>';
 $('suppliersTable').innerHTML='<table><tr><th>Company</th><th>Contact</th><th>Phone</th><th>Area</th></tr>'+db.suppliers.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.contact)+'</td><td>'+esc(x.phone)+'</td><td>'+esc(x.area)+'</td></tr>').join('')+'</table>';
}
function bind(){
 $('connectBtn').addEventListener('click',connect);
 $('saveBtn').addEventListener('click',async()=>{try{await writeExcel();toast('Excel workbook saved.')}catch(e){toast(e.message,true)}});
 document.querySelectorAll('.navbtn,.action').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.page)));
 $('addProduct').addEventListener('click',()=>{$('productForm').reset();$('productDialog').showModal()});
 $('addCustomer').addEventListener('click',()=>{$('customerForm').reset();$('customerDialog').showModal()});
 $('addSupplier').addEventListener('click',()=>{$('supplierForm').reset();$('supplierDialog').showModal()});
 $('productForm').addEventListener('submit',async e=>{e.preventDefault();const p={id:uid(),sku:$('pSku').value.trim(),name:$('pName').value.trim(),brand:$('pBrand').value.trim(),type:$('pType').value.trim(),shade:$('pShade').value.trim(),finish:$('pFinish').value.trim(),packSize:$('pPack').value.trim(),unit:$('pUnit').value.trim(),cost:+$('pCost').value,sell:+$('pSell').value,gst:+$('pGst').value,stock:+$('pStock').value,reorder:+$('pReorder').value,rack:$('pRack').value.trim()};if(db.products.some(x=>x.sku===p.sku))return toast('SKU already exists.',true);db.products.push(p);await writeExcel();$('productDialog').close();render();toast('Product saved to Excel.')});
 $('customerForm').addEventListener('submit',async e=>{e.preventDefault();db.customers.push({id:uid(),shop:$('cShop').value.trim(),name:$('cName').value.trim(),phone:$('cPhone').value.trim(),area:$('cArea').value.trim(),gstin:$('cGstin').value.trim(),credit:+$('cCredit').value,address:$('cAddress').value.trim()});await writeExcel();$('customerDialog').close();render();toast('Customer saved.')});
 $('supplierForm').addEventListener('submit',async e=>{e.preventDefault();db.suppliers.push({id:uid(),name:$('sName').value.trim(),contact:$('sContact').value.trim(),phone:$('sPhone').value.trim(),email:$('sEmail').value.trim(),area:$('sArea').value.trim(),gstin:$('sGstin').value.trim(),address:$('sAddress').value.trim()});await writeExcel();$('supplierDialog').close();render();toast('Supplier saved.')});
 $('saleForm').addEventListener('submit',async e=>{e.preventDefault();const p=db.products.find(x=>x.id===$('saleProduct').value),q=+$('saleQty').value;if(!p||q<=0)return toast('Choose a product and quantity.',true);if(p.stock<q)return toast('Insufficient stock. Available: '+p.stock,true);const c=db.customers.find(x=>x.id===$('saleCustomer').value),sub=q*p.sell,discount=+$('saleDiscount').value||0,total=Math.max(0,sub-discount),paid=+$('salePaid').value||0,x={id:uid(),invoice:'SAL-'+Date.now(),customerId:c?.id||'',customer:c?.name||'Walk-in customer',productId:p.id,product:p.name,qty:q,price:p.sell,discount,total,paid,due:Math.max(0,total-paid),payment:$('salePayment').value,date:new Date().toISOString()};p.stock-=q;db.sales.push(x);await writeExcel();e.target.reset();render();toast(x.invoice+' saved.')});
 $('purchaseForm').addEventListener('submit',async e=>{e.preventDefault();const p=db.products.find(x=>x.id===$('purchaseProduct').value),q=+$('purchaseQty').value,cost=+$('purchaseCost').value;if(!p||q<=0)return toast('Choose a product and valid quantity.',true);const s=db.suppliers.find(x=>x.id===$('purchaseSupplier').value),total=q*cost,paid=+$('purchasePaid').value||0,x={id:uid(),invoice:$('purchaseInvoice').value.trim()||'PUR-'+Date.now(),supplierId:s?.id||'',supplier:s?.name||'Unknown supplier',productId:p.id,product:p.name,qty:q,cost,total,paid,due:Math.max(0,total-paid),payment:'Cash',date:new Date().toISOString()};p.stock+=q;p.cost=cost;db.purchases.push(x);await writeExcel();e.target.reset();render();toast(x.invoice+' saved.')});
}
bind();render();