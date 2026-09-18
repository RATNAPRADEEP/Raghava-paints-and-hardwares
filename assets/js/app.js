const CLIENT_ID='911229643443-mp5i74p1h7jdonfev8180n9i1o6f9nn1.apps.googleusercontent.com';
const API_KEY='AIzaSyCoRIWkMUrYNzvJxHKjOCZqvLVvoUhj2jM';
const APP_ID='911229643443';
const SCOPES='https://www.googleapis.com/auth/drive.file';
const FILE='Raghava_Paints_Hardwares_Asian_Paints_Master_Expanded.xlsx';
let accessToken=null,driveFileId=null,tokenClient=null;
let db={products:[],subproducts:[],customers:[],suppliers:[],sales:[],purchases:[],myRecords:[],otherRecords:[]};
let sourceWorkbook=null;
let workbookName=FILE;
let gapiResolve,gisResolve;
const gapiReady=new Promise(r=>gapiResolve=r),gisReady=new Promise(r=>gisResolve=r);
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money=v=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(v||0));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function toast(t,err=false){$('toast').innerHTML='<div class="toast '+(err?'err':'')+'">'+esc(t)+'</div>';setTimeout(()=>$('toast').innerHTML='',3500)}
function nav(page){document.querySelectorAll('.section').forEach(x=>x.classList.toggle('show',x.id===page));document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.page===page))}
function emptyDb(){db={products:[],subproducts:[],customers:[],suppliers:[],sales:[],purchases:[],myRecords:[],otherRecords:[]}}
function jsonSheet(data,headers){const a=data.length?data:[Object.fromEntries(headers.map(h=>[h,'']))];return XLSX.utils.json_to_sheet(a,{header:headers})}
const headers={
Subproducts:['ID','SKU','Category','Brand','ProductName','Variant','Size','Unit','PurchasePrice','SellingPrice','GSTPercent','Stock','ReorderLevel','Supplier','Barcode','Rack','Active','Source','VerifiedOn','Notes'],
Products:['ID','SKU','Brand','ProductType','ProductName','Shade','Finish','Size','Unit','PurchasePrice','SellingPrice','GSTPercent','Stock','ReorderLevel','Supplier','Barcode','Rack','Active','CreatedAt','PriceBasis','Source','VerifiedOn'],
Customers:['ID','ShopName','CustomerName','Phone','Area','GSTIN','CreditLimit','Address'],
Suppliers:['ID','CompanyName','ContactName','Phone','Email','Area','GSTIN','Address'],
Sales:['ID','Invoice','CustomerID','Customer','ProductID','Product','Quantity','UnitPrice','Discount','Total','Paid','Due','PaymentMethod','Date'],
Purchases:['ID','Invoice','SupplierID','Supplier','ProductID','Product','Quantity','UnitCost','Total','Paid','Due','PaymentMethod','Date'],
'Stock Movements':['ID','ProductID','Product','Type','Quantity','ReferenceID','Date'],
'My Records':['RecordID','RecordType','RecordedBy','Date','ReferenceID','ProductID','Product','Quantity','UnitPriceOrCost','Amount','PaymentMethod','Notes'],
'Other Records':['RecordID','RecordType','RecordedBy','Date','ReferenceID','ProductID','Product','Quantity','UnitPriceOrCost','Amount','PaymentMethod','Notes']
};
function sheetRows(wb,names){for(const n of names){if(wb.Sheets[n])return XLSX.utils.sheet_to_json(wb.Sheets[n],{defval:''})}return []}
function setSheet(wb,name,data,cols){
 const ws=jsonSheet(data,cols);
 if(wb.Sheets[name]){const i=wb.SheetNames.indexOf(name);wb.Sheets[name]=ws; if(i>=0)wb.SheetNames[i]=name}
 else XLSX.utils.book_append_sheet(wb,ws,name);
}
async function buildWorkbook(){
 if(!sourceWorkbook)throw Error('Connect a Google Drive workbook first.');
 const wb=sourceWorkbook;
 const sp=db.subproducts.map(x=>({ID:x.id,SKU:x.sku,Category:x.category,Brand:x.brand,ProductName:x.name,Variant:x.variant,Size:x.size,Unit:x.unit,PurchasePrice:x.cost,SellingPrice:x.sell,GSTPercent:x.gst,Stock:x.stock,ReorderLevel:x.reorder,Supplier:x.supplier||'',Barcode:x.barcode||'',Rack:x.rack||'',Active:x.active!==false,Source:x.source||'',VerifiedOn:x.verifiedOn||'',Notes:x.notes||''}));
 const p=db.products.map(x=>({ID:x.id,SKU:x.sku,Brand:x.brand,ProductType:x.type,ProductName:x.name,Shade:x.shade,Finish:x.finish,Size:x.packSize,Unit:x.unit,PurchasePrice:x.cost,SellingPrice:x.sell,GSTPercent:x.gst,Stock:x.stock,ReorderLevel:x.reorder,Supplier:x.supplier||'',Barcode:x.barcode||'',Rack:x.rack||'',Active:x.active!==false,CreatedAt:x.createdAt||new Date().toISOString().slice(0,10),PriceBasis:x.priceBasis||'',Source:x.source||'',VerifiedOn:x.verifiedOn||''}));
 const c=db.customers.map(x=>({ID:x.id,ShopName:x.shop,CustomerName:x.name,Phone:x.phone,Area:x.area,GSTIN:x.gstin,CreditLimit:x.credit,Address:x.address}));
 const s=db.suppliers.map(x=>({ID:x.id,CompanyName:x.name,ContactName:x.contact,Phone:x.phone,Email:x.email,Area:x.area,GSTIN:x.gstin,Address:x.address}));
 const sales=db.sales.map(x=>({ID:x.id,Invoice:x.invoice,CustomerID:x.customerId,Customer:x.customer,ProductID:x.productId,Product:x.product,Quantity:x.qty,UnitPrice:x.price,Discount:x.discount,Total:x.total,Paid:x.paid,Due:x.due,PaymentMethod:x.payment,Date:x.date}));
 const purchases=db.purchases.map(x=>({ID:x.id,Invoice:x.invoice,SupplierID:x.supplierId,Supplier:x.supplier,ProductID:x.productId,Product:x.product,Quantity:x.qty,UnitCost:x.cost,Total:x.total,Paid:x.paid,Due:x.due,PaymentMethod:x.payment,Date:x.date}));
 const myRecords=db.myRecords.map(x=>({RecordID:x.id,RecordType:x.type,RecordedBy:x.recordedBy,Date:x.date,ReferenceID:x.referenceId,ProductID:x.productId,Product:x.product,Quantity:x.qty,UnitPriceOrCost:x.amountBase,Amount:x.amount,PaymentMethod:x.payment,Notes:x.notes||''}));
 const otherRecords=db.otherRecords.map(x=>({RecordID:x.id,RecordType:x.type,RecordedBy:x.recordedBy,Date:x.date,ReferenceID:x.referenceId,ProductID:x.productId,Product:x.product,Quantity:x.qty,UnitPriceOrCost:x.amountBase,Amount:x.amount,PaymentMethod:x.payment,Notes:x.notes||''}));
 setSheet(wb,'My_Records',myRecords,headers['My Records']);
 setSheet(wb,'Other_Records',otherRecords,headers['Other Records']);
 const mov=[...db.sales.map(x=>({ID:uid(),ProductID:x.productId,Product:x.product,Type:'SALE',Quantity:-x.qty,ReferenceID:x.invoice,Date:x.date})),...db.purchases.map(x=>({ID:uid(),ProductID:x.productId,Product:x.product,Type:'PURCHASE',Quantity:x.qty,ReferenceID:x.invoice,Date:x.date}))];
 setSheet(wb,'Subproducts',sp,headers.Subproducts);
 setSheet(wb,'Products_Inventory',p,headers.Products);
 setSheet(wb,'Customers',c,headers.Customers);
 setSheet(wb,'Suppliers',s,headers.Suppliers);
 setSheet(wb,'Sales',sales,headers.Sales);
 setSheet(wb,'Purchases',purchases,headers.Purchases);
 setSheet(wb,'Stock_Movements',mov,headers['Stock Movements']);

 return XLSX.write(wb,{bookType:'xlsx',type:'array'});
}
async function driveFetch(url,options={},retry=true){const response=await fetch(url,{...options,headers:{...(options.headers||{}),Authorization:'Bearer '+accessToken}});if(response.status===401&&retry){await requestToken('');return driveFetch(url,options,false)}return response}
async function writeExcel(){
 if(!driveFileId)throw Error('Google Drive workbook is not connected.');
 const bytes=await buildWorkbook();
 const res=await driveFetch('https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(driveFileId)+'?uploadType=media',{method:'PATCH',headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},body:bytes});
 if(!res.ok)throw Error('Google Drive save failed ('+res.status+').');
}
function read(wb,n){return wb.Sheets[n]?XLSX.utils.sheet_to_json(wb.Sheets[n],{defval:''}):[]}
function loadData(wb){
 sourceWorkbook=wb;
 let pr=read(wb,'Products_Inventory');
 if(!pr.length)pr=read(wb,'Products_Catalogue');
 if(!pr.length)pr=read(wb,'Products');
 db.subproducts=read(wb,'Subproducts').map(r=>({id:r.ID||uid(),sku:r.SKU||'',category:r.Category||'Other',brand:r.Brand||'',name:r.ProductName||r.Name||'',variant:r.Variant||'',size:String(r.Size??''),unit:r.Unit||'piece',cost:+(r.PurchasePrice||0),sell:+(r.SellingPrice||0),gst:+(r.GSTPercent||0),stock:+(r.Stock||0),reorder:(r.ReorderLevel===''||r.ReorderLevel==null)?0:+r.ReorderLevel,supplier:r.Supplier||'',barcode:r.Barcode||'',rack:r.Rack||'',active:String(r.Active).toLowerCase()!=='false',source:r.Source||'',verifiedOn:r.VerifiedOn||'',notes:r.Notes||''}));
 db.products=pr.map(r=>({id:r.ID||uid(),sku:r.SKU||'',name:r.Name||r.ProductName||'',brand:r.Brand||'',type:r.Type||r.ProductType||'',shade:r.Shade||'',finish:r.Finish||'',packSize:r.PackSize||r.Size||'',unit:r.Unit||'piece',cost:+(r.PurchasePrice||0),sell:+(r.SellingPrice||r.Price||0),gst:+(r.GSTPercent||r.GST||0),stock:+(r.Stock||0),reorder:(r.ReorderLevel===''||r.ReorderLevel==null)?0:+r.ReorderLevel,rack:r.Rack||'',supplier:r.Supplier||'',barcode:r.Barcode||'',active:String(r.Active).toLowerCase()!=='false',createdAt:r.CreatedAt||'',priceBasis:r.PriceBasis||'',source:r.Source||'',verifiedOn:r.VerifiedOn||''}));
 db.customers=read(wb,'Customers').map(r=>({id:r.ID||uid(),shop:r.ShopName||'',name:r.CustomerName||r.Name||'',phone:r.Phone||r.ContactNumber||'',area:r.Area||'',gstin:r.GSTIN||'',credit:+(r.CreditLimit||0),address:r.Address||''}));
 db.suppliers=read(wb,'Suppliers').map(r=>({id:r.ID||uid(),name:r.CompanyName||r.Name||'',contact:r.ContactName||'',phone:r.Phone||r.ContactNumber||'',email:r.Email||'',area:r.Area||'',gstin:r.GSTIN||'',address:r.Address||''}));
 db.sales=read(wb,'Sales').map(r=>({id:r.ID||uid(),invoice:r.Invoice||'',customerId:r.CustomerID||'',customer:r.Customer||'',productId:r.ProductID||'',product:r.Product||'',qty:+(r.Quantity||0),price:+(r.UnitPrice||r.Rate||0),discount:+(r.Discount||0),total:+(r.Total||0),paid:+(r.Paid||0),due:+(r.Due||0),payment:r.PaymentMethod||'',date:r.Date||''}));
 db.purchases=read(wb,'Purchases').map(r=>({id:r.ID||uid(),invoice:r.Invoice||'',supplierId:r.SupplierID||'',supplier:r.Supplier||'',productId:r.ProductID||'',product:r.Product||'',qty:+(r.Quantity||0),cost:+(r.UnitCost||0),total:+(r.Total||0),paid:+(r.Paid||0),due:+(r.Due||0),payment:r.PaymentMethod||'',date:r.Date||''}));
 const mapRecord=r=>({id:r.RecordID||uid(),type:r.RecordType||'Other',recordedBy:r.RecordedBy||'Other',date:r.Date||'',referenceId:r.ReferenceID||'',productId:r.ProductID||'',product:r.Product||'',qty:+(r.Quantity||0),amountBase:+(r.UnitPriceOrCost||0),amount:+(r.Amount||0),payment:r.PaymentMethod||'',notes:r.Notes||''});
 db.myRecords=read(wb,'My_Records').map(mapRecord); db.otherRecords=read(wb,'Other_Records').map(mapRecord);
}
function gapiLoaded(){gapi.load('client:picker',()=>gapiResolve());}
function gisLoaded(){tokenClient=google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID,scope:SCOPES,callback:()=>{}});gisResolve();}
function requestToken(prompt=''){return new Promise((resolve,reject)=>{tokenClient.callback=r=>{if(r.error)return reject(r);accessToken=r.access_token;resolve(accessToken)};tokenClient.requestAccessToken({prompt});});}
async function connect(){
 if(API_KEY==='__GOOGLE_DRIVE_API_KEY__')return toast('Add the Google API key in assets/js/app.js before connecting.',true);
 try{
  await Promise.all([gapiReady,gisReady]);
  await requestToken(accessToken?'':'consent');
  const view=new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(false).setMimeTypes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const picker=new google.picker.PickerBuilder().addView(view).setOAuthToken(accessToken).setDeveloperKey(API_KEY).setAppId(APP_ID).setCallback(async data=>{
   if(data.action!==google.picker.Action.PICKED)return;
   try{
    const doc=data[google.picker.Response.DOCUMENTS][0];
    driveFileId=doc[google.picker.Document.ID];
    const meta=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(driveFileId)+'?fields=id,name,mimeType',{headers:{Authorization:'Bearer '+accessToken}});
    if(!meta.ok)throw Error('Could not read the selected Drive file.');
    const file=await meta.json();
    if(file.mimeType!=='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')throw Error('Please select an .xlsx workbook.');
    const bin=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(driveFileId)+'?alt=media',{headers:{Authorization:'Bearer '+accessToken}});
    if(!bin.ok)throw Error('Could not download the selected workbook.');
    loadData(XLSX.read(await bin.arrayBuffer(),{type:'array'}));
    setConnected(file.name||FILE);render();toast('Google Drive workbook connected.');
   }catch(e){driveFileId=null;toast('Connection failed: '+(e.message||e),true);}
  }).build();
  picker.setVisible(true);
 }catch(e){toast('Google sign-in failed. '+(e.message||e),true);}
}
function setConnected(name=FILE){$('dot').classList.add('on');$('connectionText').textContent='Google Drive connected';$('state').textContent='Connected — '+name;$('state').classList.add('on')}
function opts(a,placeholder){return '<option value="">'+placeholder+'</option>'+a.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name||x.shop)+'</option>').join('')}
function render(){
 $('productsCount').textContent=db.products.length;
 $('stockCount').textContent=db.products.reduce((n,p)=>n+Number(p.stock),0).toLocaleString('en-IN');
 $('inventoryValue').textContent=money(db.products.reduce((n,p)=>n+p.stock*p.cost,0));
 const today=new Date();const todayKey=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');$('todaySales').textContent=money(db.sales.filter(x=>String(x.date).slice(0,10)===todayKey).reduce((n,x)=>n+x.total,0));
 $('lowStockCount').textContent=db.products.filter(p=>p.stock<=p.reorder).length;
 $('saleCustomer').innerHTML=opts(db.customers,'Walk-in customer');$('saleProduct').innerHTML=opts(db.products,'Choose paint / main product');$('saleSubproductCategory').innerHTML='<option value="">Choose category</option>'+[...new Set(db.subproducts.filter(x=>x.active!==false).map(x=>x.category))].sort().map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');$('saleSubproductSize').innerHTML='<option value="">Choose size</option>';$('saleSubproduct').innerHTML='<option value="">Choose subproduct</option>';$('purchaseSupplier').innerHTML=opts(db.suppliers,'Choose supplier');$('purchaseProduct').innerHTML=opts(db.products,'Choose product');
 $('productsTable').innerHTML='<table><tr><th>SKU</th><th>Product</th><th>Brand / Type</th><th>Shade</th><th>Pack</th><th>Sell</th><th>Stock</th><th>Status</th></tr>'+db.products.map(p=>'<tr><td>'+esc(p.sku)+'</td><td><b>'+esc(p.name)+'</b></td><td>'+esc(p.brand)+' / '+esc(p.type)+'</td><td>'+esc(p.shade)+'</td><td>'+esc(p.packSize)+' '+esc(p.unit)+'</td><td>'+money(p.sell)+'</td><td>'+p.stock+'</td><td><span class="pill '+(p.stock<=p.reorder?'low':'')+'">'+(p.stock<=0?'OUT':p.stock<=p.reorder?'LOW':'OK')+'</span></td></tr>').join('')+'</table>';
 $('lowStock').innerHTML=[...db.products,...db.subproducts].filter(p=>p.stock<=p.reorder).map(p=>'<p><b>'+esc(p.name)+'</b> — '+p.stock+' '+esc(p.unit)+'</p>').join('')||'<p>No low-stock products.</p>';
 const top={};db.sales.forEach(x=>top[x.product]=(top[x.product]||0)+x.qty);$('topProducts').innerHTML=Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>'<p><b>'+esc(x[0])+'</b> — '+x[1]+' sold</p>').join('')||'<p>No sales yet.</p>';
 $('salesTable').innerHTML='<table><tr><th>Invoice</th><th>Customer</th><th>Product</th><th>Qty</th><th>Total</th><th>Paid</th><th>Due</th></tr>'+db.sales.slice().reverse().map(x=>'<tr><td>'+esc(x.invoice)+'</td><td>'+esc(x.customer)+'</td><td>'+esc(x.product)+'</td><td>'+x.qty+'</td><td>'+money(x.total)+'</td><td>'+money(x.paid)+'</td><td>'+money(x.due)+'</td></tr>').join('')+'</table>';
 $('purchasesTable').innerHTML='<table><tr><th>Invoice</th><th>Supplier</th><th>Product</th><th>Qty</th><th>Total</th><th>Paid</th><th>Due</th></tr>'+db.purchases.slice().reverse().map(x=>'<tr><td>'+esc(x.invoice)+'</td><td>'+esc(x.supplier)+'</td><td>'+esc(x.product)+'</td><td>'+x.qty+'</td><td>'+money(x.total)+'</td><td>'+money(x.paid)+'</td><td>'+money(x.due)+'</td></tr>').join('')+'</table>';
 $('customersTable').innerHTML='<table><tr><th>Shop</th><th>Customer</th><th>Phone</th><th>Area</th></tr>'+db.customers.map(x=>'<tr><td>'+esc(x.shop)+'</td><td>'+esc(x.name)+'</td><td>'+esc(x.phone)+'</td><td>'+esc(x.area)+'</td></tr>').join('')+'</table>';
 $('suppliersTable').innerHTML='<table><tr><th>Company</th><th>Contact</th><th>Phone</th><th>Area</th></tr>'+db.suppliers.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.contact)+'</td><td>'+esc(x.phone)+'</td><td>'+esc(x.area)+'</td></tr>').join('')+'</table>';
}
function bind(){
 $('connectBtn').addEventListener('click',connect);
 $('saveBtn').addEventListener('click',async()=>{try{await writeExcel();toast('Workbook saved to Google Drive.')}catch(e){toast(e.message,true)}});
 document.querySelectorAll('.navbtn,.action').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.page)));
 $('addProduct').addEventListener('click',()=>{$('productForm').reset();$('productDialog').showModal()});
 $('addCustomer').addEventListener('click',()=>{$('customerForm').reset();$('customerDialog').showModal()});
 $('addSupplier').addEventListener('click',()=>{$('supplierForm').reset();$('supplierDialog').showModal()});
 $('productForm').addEventListener('submit',async e=>{e.preventDefault();const p={id:uid(),sku:$('pSku').value.trim(),name:$('pName').value.trim(),brand:$('pBrand').value.trim(),type:$('pType').value.trim(),shade:$('pShade').value.trim(),finish:$('pFinish').value.trim(),packSize:$('pPack').value.trim(),unit:$('pUnit').value.trim(),cost:+$('pCost').value,sell:+$('pSell').value,gst:+$('pGst').value,stock:+$('pStock').value,reorder:+$('pReorder').value,rack:$('pRack').value.trim(),supplier:'',barcode:'',active:true,createdAt:new Date().toISOString().slice(0,10),priceBasis:'',source:'',verifiedOn:''};if(!p.sku||!p.name)return toast('SKU and product name are required.',true);if(db.products.some(x=>x.sku===p.sku))return toast('SKU already exists.',true);db.products.push(p);try{await writeExcel();$('productDialog').close();render();toast('Product saved to Google Drive.')}catch(err){db.products.pop();toast(err.message,true)}});
$('customerForm').addEventListener('submit',async e=>{e.preventDefault();const x={id:uid(),shop:$('cShop').value.trim(),name:$('cName').value.trim(),phone:$('cPhone').value.trim(),area:$('cArea').value.trim(),gstin:$('cGstin').value.trim(),credit:+$('cCredit').value,address:$('cAddress').value.trim()};db.customers.push(x);try{await writeExcel();$('customerDialog').close();render();toast('Customer saved.')}catch(err){db.customers.pop();toast(err.message,true)}});
$('supplierForm').addEventListener('submit',async e=>{e.preventDefault();const x={id:uid(),name:$('sName').value.trim(),contact:$('sContact').value.trim(),phone:$('sPhone').value.trim(),email:$('sEmail').value.trim(),area:$('sArea').value.trim(),gstin:$('sGstin').value.trim(),address:$('sAddress').value.trim()};db.suppliers.push(x);try{await writeExcel();$('supplierDialog').close();render();toast('Supplier saved.')}catch(err){db.suppliers.pop();toast(err.message,true)}});
$('saleForm').addEventListener('submit',async e=>{e.preventDefault();const p=db.products.find(x=>x.id===$('saleProduct').value),q=+$('saleQty').value;if(!p||q<=0)return toast('Choose a product and quantity.',true);if(p.stock<q)return toast('Insufficient stock. Available: '+p.stock,true);const c=db.customers.find(x=>x.id===$('saleCustomer').value),sub=q*p.sell,discount=Math.max(0,+$('saleDiscount').value||0),total=Math.max(0,sub-discount),paid=Math.max(0,+$('salePaid').value||0);if(paid>total)return toast('Paid amount cannot exceed the sale total.',true);const x={id:uid(),invoice:'SAL-'+Date.now(),customerId:c?.id||'',customer:c?.name||'Walk-in customer',productId:p.id,product:p.name,qty:q,price:p.sell,discount,total,paid,due:total-paid,payment:$('salePayment').value,date:new Date().toISOString()};p.stock-=q;db.sales.push(x);const rec={id:uid(),type:'Sale',recordedBy:$('saleRecordedBy').value,date:x.date,referenceId:x.invoice,productId:p.id,product:p.name,qty:q,amountBase:p.sell,amount:total,payment:x.payment,notes:isSub?'Subproduct: '+p.category+' / '+p.size+' '+p.unit:''};(rec.recordedBy==='Me'?db.myRecords:db.otherRecords).push(rec);try{await writeExcel();e.target.reset();render();toast(x.invoice+' saved.')}catch(err){p.stock+=q;db.sales.pop();(rec.recordedBy==='Me'?db.myRecords:db.otherRecords).pop();toast(err.message,true)}});
$('purchaseForm').addEventListener('submit',async e=>{e.preventDefault();const p=db.products.find(x=>x.id===$('purchaseProduct').value),q=+$('purchaseQty').value,cost=Math.max(0,+$('purchaseCost').value||0);if(!p||q<=0)return toast('Choose a product and valid quantity.',true);const s=db.suppliers.find(x=>x.id===$('purchaseSupplier').value),total=q*cost,paid=Math.max(0,+$('purchasePaid').value||0);if(paid>total)return toast('Paid amount cannot exceed the purchase total.',true);const x={id:uid(),invoice:$('purchaseInvoice').value.trim()||'PUR-'+Date.now(),supplierId:s?.id||'',supplier:s?.name||'Unknown supplier',productId:p.id,product:p.name,qty:q,cost,total,paid,due:total-paid,payment:$('purchasePayment').value,date:new Date().toISOString()};p.stock+=q;const oldCost=p.cost;p.cost=cost;db.purchases.push(x);const rec={id:uid(),type:'Purchase',recordedBy:$('purchaseRecordedBy').value,date:x.date,referenceId:x.invoice,productId:p.id,product:p.name,qty:q,amountBase:cost,amount:total,payment:x.payment,notes:''};(rec.recordedBy==='Me'?db.myRecords:db.otherRecords).push(rec);try{await writeExcel();e.target.reset();render();toast(x.invoice+' saved.')}catch(err){p.stock-=q;p.cost=oldCost;db.purchases.pop();(rec.recordedBy==='Me'?db.myRecords:db.otherRecords).pop();toast(err.message,true)}});

}
bind();render();
