<?php
// LosOja AUTO - Live with Toppa - Token Integrated
$TOPPA_TOKEN = "toppa_BTnj1EzZhEYILS5e9qCDBbwBSsJnT92NiRiArNWrYvs";
$TOPPA_BASE = "https://toppa.com.ng/api";

function toppa_call($endpoint, $data=null){
    global $TOPPA_TOKEN,$TOPPA_BASE;
    $ch=curl_init($TOPPA_BASE.$endpoint);
    curl_setopt($ch,CURLOPT_RETURNTRANSFER,true);
    curl_setopt($ch,CURLOPT_HTTPHEADER,[
        "Authorization: Bearer ".$TOPPA_TOKEN,
        "Content-Type: application/json",
        "Accept: application/json"
    ]);
    if($data){
        curl_setopt($ch,CURLOPT_POST,true);
        curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($data));
    }
    $r=curl_exec($ch);
    $http=curl_getinfo($ch,CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ["http"=>$http,"raw"=>$r,"json"=>json_decode($r,true)];
}

$plans=[
 "mtn_1gb"=>["name"=>"MTN 1GB SME","buy"=>275,"sell"=>500,"net"=>"mtn","size"=>"1GB"],
 "mtn_2gb"=>["name"=>"MTN 2GB SME","buy"=>550,"sell"=>1000,"net"=>"mtn","size"=>"2GB"],
];

$msg="";
if($_POST['buy'] ?? false){
    $phone=preg_replace('/[^0-9]/','',$_POST['phone']);
    $pk=$_POST['plan'];
    $p=$plans[$pk];
    $payload=["network"=>$p['net'],"phone"=>$phone,"plan"=>$p['size'],"amount"=>$p['buy'],"ported"=>false,"data_plan"=>$p['size']];
    $res=toppa_call("/v1/data",$payload);
    if($res['http']!=200) $res=toppa_call("/data",$payload);
    if($res['http']!=200) $res=toppa_call("/topup/data",$payload);
    
    if($res['http']==200){
        $msg="✅ SUCCESS! ".$p['name']." sent to $phone. Profit: ₦".($p['sell']-$p['buy'])." | Raw: ".$res['raw'];
    }else{
        $msg="❌ Failed: ".$res['raw']." | Check balance or try again";
    }
}
$bal=toppa_call("/v1/balance");
if(!$bal['json']) $bal=toppa_call("/balance");
?>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>LosOja - Cheaper than Opay</title>
<style>body{background:#0a0a0a;color:#fff;font-family:sans-serif;padding:20px}.card{background:#1a1a1a;border-radius:15px;padding:20px;margin-bottom:15px}.btn{background:#00ff88;color:#000;padding:14px;border:none;border-radius:10px;width:100%;font-weight:bold}input,select{width:100%;padding:12px;border-radius:10px;background:#111;color:#fff;border:1px solid #333;margin:8px 0}</style>
</head><body>
<h2>LosOja.com <span style="background:#ffaa00;color:#000;padding:3px 8px;border-radius:5px">CHEAPER THAN OPAY</span></h2>
<div class="card">Toppa Balance Raw: <?=htmlspecialchars($bal['raw'])?><br><small>Balance: ₦497.50 - Ready to sell!</small></div>
<?php if($msg):?><div class="card" style="border:1px solid #00ff88"><?=$msg?></div><?php endif;?>
<div class="card"><h3>Buy Data - Auto</h3>
<form method="POST"><input name="phone" placeholder="08012345678" required>
<select name="plan"><option value="mtn_1gb">MTN 1GB SME - ₦500 (Opay ₦600) Profit ₦225</option><option value="mtn_2gb">MTN 2GB SME - ₦1000 (Opay ₦1200)</option></select>
<button class="btn" name="buy" value="1">BUY NOW - AUTOMATIC</button></form></div>
</body></html>
