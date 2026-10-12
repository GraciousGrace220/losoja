// LosOja Shop Addon - Makes any shop shoppable without breaking old code
(function(){
const grid = document.getElementById('productGrid') || document.querySelector('.product-placeholder');

const CART_KEY='losoja_cart_'+(new URLSearchParams(location.search).get('id')||'general');
let CART=JSON.parse(localStorage.getItem(CART_KEY)||'[]');
let PRODUCTS=[];

function escapeHTML(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

window.loadShopProducts = async function(business){
  PRODUCTS=[
    {id:business.id+'_1', name: business.name+' Package', price: business.price||2500, image: business.image_url||'', description: 'Top quality from '+business.name},
    {id:business.id+'_2', name: 'Premium Service', price: 5000, image: business.image_url||'', description: 'Best seller'},
    {id:business.id+'_3', name: 'Delivery Package', price: 1500, image: '', description: 'Fast delivery'}
  ];
  render();
}

function render(){
 const parent = document.getElementById('productGrid');
 if(!parent) return;
 parent.innerHTML = PRODUCTS.map(p=>`
  <div class="shop-product" style="border:1px solid #e2ebe5;background:#fff;border-radius:16px;overflow:hidden;display:flex;flex-direction:column">
    <img src="${p.image}" style="width:100%;height:170px;object-fit:cover;background:#eef3ef" onerror="this.style.display='none'">
    <div style="padding:12px">
      <div style="font-weight:800;color:#123d25">${escapeHTML(p.name)}</div>
      <div style="font-weight:900;color:#087a3e;margin:6px 0">₦${Number(p.price).toLocaleString()}</div>
      <button onclick="addToCart('${p.id}')" style="width:100%;background:#087a3e;color:#fff;border:0;border-radius:10px;padding:11px;font-weight:800;cursor:pointer">🛒 Add to Cart</button>
    </div>
  </div>`).join('');
  updateCount();
}

window.addToCart=function(pid){
 const prod=PRODUCTS.find(x=>String(x.id)==String(pid)); if(!prod) return;
 const ex=CART.find(c=>String(c.id)==String(pid));
 if(ex) ex.qty++; else CART.push({id:prod.id,name:prod.name,price:prod.price,image:prod.image,qty:1});
 localStorage.setItem(CART_KEY,JSON.stringify(CART));
 updateCount(); alert(prod.name+' added to cart ✅'); openCart();
}

function updateCount(){
 const c=document.getElementById('cartCount');
 if(!c) return;
 const total=CART.reduce((s,i)=>s+i.qty,0);
 c.textContent=total; c.style.display=total>0?'flex':'none';
 document.getElementById('cartTotal') && (document.getElementById('cartTotal').textContent='₦'+CART.reduce((s,i)=>s+(i.price*i.qty),0).toLocaleString());
 const itemsEl=document.getElementById('cartItems');
 if(itemsEl){
   if(!CART.length) itemsEl.innerHTML='<div style="padding:30px;text-align:center;color:#777">Cart empty</div>';
   else itemsEl.innerHTML=CART.map(it=>`<div style="display:flex;gap:10px;border:1px solid #eee;border-radius:10px;padding:10px;margin-bottom:8px"><div style="flex:1"><b>${escapeHTML(it.name)}</b><br>₦${it.price} × ${it.qty}</div><button onclick="removeItem('${it.id}')" style="color:red;border:0;background:#fee;padding:5px 8px;border-radius:6px">✕</button></div>`).join('');
 }
}

window.removeItem=function(pid){CART=CART.filter(c=>String(c.id)!=String(pid)); localStorage.setItem(CART_KEY,JSON.stringify(CART)); updateCount();}

window.openCart = function(){
    const drawer = document.getElementById('cartDrawer');

    if(!drawer) return;

    drawer.style.display = 'block';
    updateCount();
};

window.closeCart = function(){
    const drawer = document.getElementById('cartDrawer');

    if(!drawer) return;

    drawer.style.display = 'none';
};

document.addEventListener('DOMContentLoaded',updateCount);
})();
