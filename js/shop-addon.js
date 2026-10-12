// LosOja Shop Addon - Makes any shop shoppable without breaking old code
(function(){
const grid = document.getElementById('productGrid') || document.querySelector('.product-placeholder');

const CART_KEY='losoja_cart_'+(new URLSearchParams(location.search).get('id')||'general');
let CART=JSON.parse(localStorage.getItem(CART_KEY)||'[]');
let PRODUCTS=[];

function escapeHTML(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}


window.loadShopProducts = async function(business) {
  try {
    const response = await fetch(
      'https://ycxshwgeebskdozmornh.supabase.co/rest/v1/products?business_id=eq.' +
      encodeURIComponent(business.id) +
      '&select=id,name,price,image_url,description',
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: 'Bearer ' + SUPABASE_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error('Could not load products: HTTP ' + response.status);
    }

    const rows = await response.json();

    PRODUCTS = rows.map(product => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image_url || '',
      description: product.description || ''
    }));

    render();

    if (!PRODUCTS.length) {
      document.getElementById('productGrid').innerHTML =
        '<p>No products have been added to this business yet.</p>';
    }
  } catch (error) {
    console.error('LosOja product loading failed:', error);
    document.getElementById('productGrid').innerHTML =
      '<p>Products could not be loaded. Please refresh and try again.</p>';
  }
};


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
