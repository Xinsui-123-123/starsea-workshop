(function(){
  'use strict';
  // ★ 星海工坊 V2.0 dev.27：普通“扩展程序”抽屉直接显示工坊更新状态；人物等级仅填数字并由星辉内核换算阶级/位格；能力页恢复现有五字段并支持本地自动命名。
  // ★ dev.25：人物/生灵曾统一为完整 /重要人物 结构；dev.26 已撤回这种过度统一，只为旧作品保留兼容读取。
  // ★ V1.9：新增装束 / 能力 / 物品作品与 MVU 安装；顶部分类横向滑动；NPC 显示栏目改为生灵。
  // ★ V1.8：作品数据协议层——增加标准作品包（XYWS Package v1）导入/导出，先用本地文件完整验证 A 端发布 → B 端读取 → 按类型安装；移除把星灵当 NPC 的示例。
  // ★ V1.7：人物/NPC统一双通道——可加入开场白人物名册作为开局预设，也可中途直写 MVU 重要人物；原“角色”作品不再误送主角命名档案库。
  var DEMO_WORKS = [{"id":"play_star","type":"玩法","icon":"🎮","title":"明星养成","desc":"一边经营演艺事业，一边隐藏魔法少女身份。试镜、综艺、粉丝与秘密战斗会同时来到你的生活。","tags":["娱乐圈","日常","经营","身份暴露"],"likes":3281,"uses":8924,"body":"在魔法少女生活之外体验演艺事业。\\n\\n你可以参加试镜、拍戏、综艺与代言，同时经营粉丝、舆论和业内关系。\\n\\n魔法少女身份依然需要保密。突发战斗可能与工作撞期，战斗痕迹、偷拍视频与熟人的怀疑，都可能让秘密逐渐失控。\\n\\n节奏要求：慢慢成长，不要突然成为顶级明星。"},{"id":"play_school","type":"玩法","icon":"🎮","title":"校园社团生活","desc":"加入社团、参加文化祭、处理学生会事务，把魔法少女生活藏在普通校园日常之下。","tags":["校园","日常","社团"],"likes":1850,"uses":5100,"body":"让世界增加更浓的校园生活。社团、文化祭、学生会、同学关系都可以成为日常剧情的一部分。"},{"id":"role_mashiro","type":"角色","icon":"👤","title":"朝雾真白","desc":"温柔可靠的高年级魔法少女，擅长治疗与结界，但似乎一直在隐瞒某次任务的真相。","tags":["学姐","治愈系","秘密"],"likes":2380,"uses":6340,"body":"温柔可靠的高年级魔法少女，擅长治疗和结界。她似乎一直在回避谈论某一次过去的任务。"},{"id":"role_suzu","type":"角色","icon":"👤","title":"白石铃","desc":"17岁，银灰短发。表面冷淡，实际很容易因为别人的温柔而动摇。能力为重力偏转。","tags":["高中生","新人","重力系"],"likes":1774,"uses":4210,"body":"17岁高中生，银灰色短发，性格表面冷淡。能力为重力偏转。可作为人物/NPC加入开局，也可以在剧情中途加入当前世界。"},{"id":"opening_rain","type":"开局","icon":"🎬","title":"暴雨夜的第一次变身","desc":"停电、暴雨、空无一人的车站，以及第一次听见来自星灵的呼唤。","tags":["新人","都市","第一次变身"],"likes":1430,"uses":3509,"body":"暴雨让整座城市陷入短暂混乱。停电的车站里，你第一次听见星灵呼唤自己的名字。"},{"id":"opening_stair","type":"开局","icon":"🎬","title":"转校第一天，不存在的楼梯","desc":"放学后的教学楼里，多出了一段白天从未出现过的楼梯。此时的你还没有成为魔法少女。","tags":["校园","悬疑","新人"],"likes":672,"uses":1201,"body":"今天是你转入新学校的第一天。\\n\\n放学后，教学楼里出现了一段白天从未存在过的楼梯。你还没有成为魔法少女。"},{"id":"npc_reporter","type":"NPC","icon":"✧","title":"追查魔法少女的记者","desc":"AI 会根据当前世界生成一名执着调查超自然事件的记者。","tags":["模板NPC","调查","身份危机"],"likes":914,"uses":2803,"body":"这不是固定姓名的角色，而是一份 NPC 生成模板。AI 根据当前世界生成一名调查超自然事件的记者。TA 并非纯粹的敌人，而是相信公众有知道真相的权利。"},{"id":"rule_secret","type":"规则","icon":"📜","title":"魔法严格保密","desc":"普通社会不知道魔法少女与魔物真实存在。身份暴露会带来舆论、调查与现实后果。","tags":["保密","现实感"],"likes":2019,"uses":6441,"body":"普通社会并不知道魔法少女与魔物真实存在。不要让普通 NPC 无缘无故知道魔法。身份暴露应带来合理的舆论、调查与关系后果。"},{"id":"rule_injury","type":"规则","icon":"📜","title":"伤势不会一夜消失","desc":"战斗造成的明显伤势需要合理恢复时间，不允许下一幕无解释完全痊愈。","tags":["战斗","现实感","恢复"],"likes":1180,"uses":3001,"body":"战斗造成的明显伤势需要合理恢复时间。除非有明确治疗手段，否则不要在下一幕无解释完全痊愈。"}];
  var WORKS = DEMO_WORKS.slice();
  var TYPES = ['玩法','角色','开局','NPC','规则','装束','能力','物品'];
  var ICON = {'玩法':'🎮','角色':'👤','开局':'🎬','NPC':'✧','规则':'📜','装束':'✦','能力':'◇','物品':'▣'};
  var XYWS_SKILL_SLOTS=['基础攻防','小技能','中技能','大技能','领域','规则级'];
  var XYWS_SKILL_COST_RANGES={'基础攻防':[0,8],'小技能':[20,50],'中技能':[110,180],'大技能':[360,520],'领域':[1000,1500],'规则级':[2800,4200]};
  var LS_FAV='xyws_favs_v1', LS_INST='xyws_installed_v1', LS_MINE='xyws_myworks_v1', LS_LIKED='xyws_liked_v1', LS_IMPORTED='xyws_imported_works_v1';
  var LS_PLAY_BASE='xyws_playpacks_v1', PLAY_INJECT_ID='XYWS_WORKSHOP_PLAYPACKS';
  var XYWS_PACKAGE_SCHEMA='xyws.workshop.package', XYWS_PACKAGE_VERSION=1, XYWS_MAX_IMPORT_WORKS=50;

  function install(doc, win, buttonId){
    if(!doc || !doc.body) return;


    function getLS(k,d){ try{var v=win.localStorage.getItem(k);return v==null?d:v;}catch(e){return d;} }
    function setLS(k,v){ try{win.localStorage.setItem(k,v);}catch(e){} }
    function arr(k){try{var a=JSON.parse(getLS(k,'[]'));return Array.isArray(a)?a:[];}catch(e){return[];}}
    function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
    function fmt(n){n=Number(n)||0; return n>=10000?(n/10000).toFixed(n>=100000?0:1)+'w':String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
    function xywsGetCtx(){
      try{if(win.SillyTavern&&typeof win.SillyTavern.getContext==='function')return win.SillyTavern.getContext();}catch(e){}
      try{if(window.SillyTavern&&typeof window.SillyTavern.getContext==='function')return window.SillyTavern.getContext();}catch(e2){}
      try{if(window.parent&&window.parent.SillyTavern&&typeof window.parent.SillyTavern.getContext==='function')return window.parent.SillyTavern.getContext();}catch(e3){}
      try{if(window.top&&window.top.SillyTavern&&typeof window.top.SillyTavern.getContext==='function')return window.top.SillyTavern.getContext();}catch(e4){}
      return null;
    }
    function xywsScopeId(){
      var ctx=xywsGetCtx(),chat='',cid='',gid='';
      try{chat=String((ctx&&ctx.chatId)||'');}catch(e){}
      try{if(!chat&&ctx&&typeof ctx.getCurrentChatId==='function')chat=String(ctx.getCurrentChatId()||'');}catch(e2){}
      try{cid=String((ctx&&ctx.characterId)||'');}catch(e3){}
      try{gid=String((ctx&&ctx.groupId)||'');}catch(e4){}
      if(chat)return 'chat:'+chat;if(gid)return 'group:'+gid;if(cid)return 'char:'+cid;return 'default';
    }
    function xywsHash(str){var h=2166136261,s=String(str||'');for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
    function xywsPlayKey(){return LS_PLAY_BASE+'::'+xywsHash(xywsScopeId());}
    function xywsPlayLoad(){return arr(xywsPlayKey());}
    function xywsPlaySaveLocal(a){setLS(xywsPlayKey(),JSON.stringify(a||[]));}
    var XYWS_THEME_SEP='\n▚▚▚\n';
    var XYWS_PLAY_PREFIX='【自定义辅助】【星海工坊·玩法|';
    function xywsThemeParts(raw){
      var seen={},out=[];String(raw||'').split('▚▚▚').forEach(function(x){x=String(x||'').trim();if(x&&!seen[x]){seen[x]=1;out.push(x);}});return out;
    }
    function xywsThemeJoin(a){return (a||[]).filter(Boolean).join(XYWS_THEME_SEP);}
    function xywsSafeMark(s){return String(s==null?'':s).replace(/[|】\r\n]+/g,' ').trim();}
    function xywsChunkText(text,max){
      max=max||430;var src=String(text||'').trim(),out=[];if(!src)return out;
      while(src.length>max){var cut=-1,win=src.slice(0,max+1);for(var i=win.length-1;i>=Math.floor(max*.55);i--){if(/[。！？；;\n]/.test(win.charAt(i))){cut=i+1;break;}}if(cut<0)cut=max;out.push(src.slice(0,cut).trim());src=src.slice(cut).trim();}
      if(src)out.push(src);return out;
    }
    function xywsPlayMountParts(p){
      var wid=xywsSafeMark(p&&p.workId),title=xywsSafeMark((p&&p.title)||wid||'未命名玩法'),chunks=xywsChunkText((p&&p.text)||'',430),total=chunks.length||1;
      if(!chunks.length)chunks=[''];
      return chunks.map(function(c,i){return XYWS_PLAY_PREFIX+wid+'|'+(i+1)+'/'+total+'|'+title+'】'+c;});
    }
    function xywsPlayPartInfo(raw){
      var m=String(raw||'').match(/^【自定义辅助】【星海工坊·玩法\|([^|】]+)\|([^|】]+)\|([^】]+)】/);return m?{workId:m[1],part:m[2],title:m[3]}:null;
    }
    function xywsGetLatestMvuPack(){
      var M=xywsResolveMvu();if(!M)return null;var opt={type:'message',message_id:'latest'},d=null;try{d=M.getMvuData(opt);}catch(e){}if(!d||!d.stat_data)return null;return {M:M,opt:opt,data:d};
    }
    function xywsMountedPlayCounts(){
      var pack=xywsGetLatestMvuPack();if(!pack)return null;var raw='';try{raw=String(pack.data.stat_data.系统状态.推进器.自定义取材||'');}catch(e){}
      var c={};xywsThemeParts(raw).forEach(function(x){var info=xywsPlayPartInfo(x);if(info)c[info.workId]=(c[info.workId]||0)+1;});return c;
    }
    function xywsPlayActualOn(p,counts){if(!p||!p.workId||!counts)return p&&p.on!==false;var need=xywsPlayMountParts(p).length;return (counts[String(p.workId)]||0)>=need;}
    function xywsReconcilePlayFlags(a){var counts=xywsMountedPlayCounts();if(!counts)return a||[];(a||[]).forEach(function(p){if(p&&p.workId)p.on=xywsPlayActualOn(p,counts);});return a||[];}
    async function xywsSyncPlayToPacer(){
      var pack=xywsGetLatestMvuPack();if(!pack)return false;
      var next=xywsClone(pack.data);if(!next||!next.stat_data)return false;
      if(!next.stat_data.系统状态||typeof next.stat_data.系统状态!=='object')next.stat_data.系统状态={};
      if(!next.stat_data.系统状态.推进器||typeof next.stat_data.系统状态.推进器!=='object')next.stat_data.系统状态.推进器={};
      var old=String(next.stat_data.系统状态.推进器.自定义取材||''),keep=xywsThemeParts(old).filter(function(x){return !xywsPlayPartInfo(x);}),active=[];
      xywsPlayLoad().forEach(function(p){if(p&&p.on!==false&&String(p.text||'').trim())active=active.concat(xywsPlayMountParts(p));});
      next.stat_data.系统状态.推进器.自定义取材=xywsThemeJoin(keep.concat(active));
      try{await Promise.resolve(pack.M.replaceMvuData(next,pack.opt));return true;}catch(e){return false;}
    }
    function xywsClearLegacyPlayPrompt(){
      try{var ctx=xywsGetCtx();if(ctx&&typeof ctx.setExtensionPrompt==='function'){var IN_CHAT=(ctx.extension_prompt_types&&ctx.extension_prompt_types.IN_CHAT!=null)?ctx.extension_prompt_types.IN_CHAT:1;var SYS=(ctx.extension_prompt_roles&&ctx.extension_prompt_roles.SYSTEM!=null)?ctx.extension_prompt_roles.SYSTEM:0;ctx.setExtensionPrompt(PLAY_INJECT_ID,'',IN_CHAT,0,false,SYS);}}catch(e){}
      try{var b=win.__XYWS_PLAY_GEN_BRIDGE__;if(b){b.start=function(){};b.end=function(){};}}catch(e2){}
    }
    function xywsPlayMigrationKey(){return 'xyws_play_pacer_migrated_v1::'+xywsHash(xywsScopeId());}
    async function xywsInitPlayPacerBridge(){
      xywsClearLegacyPlayPrompt();
      if(getLS(xywsPlayMigrationKey(),'0')!=='1'){
        var ok=await xywsSyncPlayToPacer();if(ok)setLS(xywsPlayMigrationKey(),'1');return ok;
      }
      var a=xywsReconcilePlayFlags(xywsPlayLoad());xywsPlaySaveLocal(a);return true;
    }

    var overlay=null, currentScreen='home', prevScreen='home', currentCat='热门', currentWork=null, pubType='角色', toastTimer=null, xywsCloudWarned=false, xywsProbeOk=false, xywsOldHtmlOverflow='', xywsOldBodyOverflow='', xywsManageWorks=[], xywsManageLoaded=false, xywsManageLoading=false, xywsManageIsAdmin=false, xywsAutoSyncTimer=null, xywsAutoSyncBusy=false, xywsPendingImport=null, xywsPublishMode='create', xywsEditingWork=null;
    var XYWS_AUTO_SYNC_MS=30000;

    var XYWS_SIZE_KEY='xyws_desktop_size_v1';
    var xywsResizeObs=null;
    function xywsIsMobile(){try{return (win.innerWidth||doc.documentElement.clientWidth||0)<=700;}catch(e){return false;}}
    function xywsLoadSize(shell){
      if(!shell||xywsIsMobile())return;
      try{
        var raw=win.localStorage.getItem(XYWS_SIZE_KEY); if(!raw)return;
        var sz=JSON.parse(raw); if(!sz)return;
        var mw=Math.max(560,Math.min(Number(sz.w)||920,(win.innerWidth||1200)*.96));
        var mh=Math.max(420,Math.min(Number(sz.h)||700,(win.innerHeight||900)*.92));
        shell.style.width=Math.round(mw)+'px'; shell.style.height=Math.round(mh)+'px';
      }catch(e){}
    }
    function xywsWatchSize(shell){
      if(!shell||!win.ResizeObserver)return;
      try{if(xywsResizeObs)xywsResizeObs.disconnect();}catch(e){}
      try{
        xywsResizeObs=new win.ResizeObserver(function(entries){
          if(xywsIsMobile()||!overlay||!overlay.classList.contains('on'))return;
          var r=entries&&entries[0]&&entries[0].contentRect; if(!r)return;
          if(r.width<550||r.height<410)return;
          try{win.localStorage.setItem(XYWS_SIZE_KEY,JSON.stringify({w:Math.round(r.width),h:Math.round(r.height)}));}catch(e){}
        });
        xywsResizeObs.observe(shell);
      }catch(e){}
    }
    function ensureOverlay(){
      overlay=doc.getElementById('xyws-overlay');
      if(overlay) return overlay;
      overlay=doc.createElement('div'); overlay.id='xyws-overlay'; overlay.className='xyws-overlay';
      overlay.innerHTML=
        '<div class="xyws-shell"><div class="xyws-stars"></div>'+
        '<div class="xyws-top"><div class="xyws-topbar"><button class="xyws-topbtn" data-a="close">← 返回</button><div class="xyws-brand"><b>星 海 工 坊</b><small>WORKSHOP OF THE COVENANT</small></div><button class="xyws-topbtn" data-go="mine">我的</button></div></div>'+
        '<div class="xyws-main">'+
          '<section class="xyws-screen" data-screen="auth"><div class="xyws-hero"><small>✦ 星图外的另一片夜空</small><h3>星 海 工 坊</h3><p>使用 Discord 登录后进入社区工坊</p></div><div class="xyws-authcard"><div class="xyws-avatar xyws-avatar-lg xyws-avatar-fallback">✦</div><p class="xyws-authnote">登录仅用于确认 Discord 身份，不会请求邮箱、服务器或身份组。</p></div><button class="xyws-primary" data-a="auth-login">使用 Discord 登录</button></section>'+
          '<section class="xyws-screen on" data-screen="home"><div class="xyws-hero"><small data-home-kicker>✦ 星图外的另一片夜空</small><h3 data-home-title>社区热门</h3><p data-home-desc>热门页按分类展示点赞较高的作品；需要更多时再进入对应分类。</p></div><div class="xyws-search">⌕<input data-q placeholder="搜索人物、生灵、开局、规则、玩法、装束、能力、物品…"></div><div class="xyws-cats" data-cats></div><div data-hot></div><div data-list style="display:none"></div></section>'+
          '<section class="xyws-screen" data-screen="favorite"><div class="xyws-hero"><small>♡ 我的星标</small><h3>收藏</h3><p>收藏只是留着以后再看，不等于已经加入本局。</p></div><div data-favs></div></section>'+
          '<section class="xyws-screen" data-screen="create"><div class="xyws-hero"><small>✦ 发布到星海</small><h3>你想分享什么？</h3><p>选择要发布的类型。</p></div><div class="xyws-creategrid">'+
            '<button class="xyws-create" data-pub="角色"><i>👤</i><b>人物</b><span>魔法少女 · 魔人 · 关键凡人等长期重要人物</span></button>'+
            '<button class="xyws-create" data-pub="开局"><i>🎬</i><b>开局</b></button>'+
            '<button class="xyws-create" data-pub="NPC"><i>✧</i><b>生灵 / 配角</b><span>星灵 · 魔物 · 使魔 · 灵兽 · 路人；不进入重要人物变量</span></button>'+
            '<button class="xyws-create" data-pub="装束"><i>✦</i><b>变身装束</b><span>变身后的服装、装甲、武装外观</span></button>'+
            '<button class="xyws-create" data-pub="能力"><i>◇</i><b>能力 / 招式</b><span>按现有招式变量结构填写</span></button>'+
            '<button class="xyws-create" data-pub="物品"><i>▣</i><b>物品</b><span>自定义类别、数量与作用</span></button>'+
            '<button class="xyws-create" data-pub="规则"><i>📜</i><b>世界规则</b></button>'+
            '<button class="xyws-create" data-pub="玩法"><i>🎮</i><b>玩法</b></button>'+
          '</div></section>'+
          '<section class="xyws-screen" data-screen="mine"><div class="xyws-hero"><small>✧ 我的星图</small><h3>我的</h3><p>这里保留一次性导入记录、我的作品与本地导入作品；作品包可用于跨浏览器/跨设备测试分享。</p></div><div data-mine></div></section>'+
          '<section class="xyws-screen" data-screen="detail"><div class="xyws-pill" data-dtype></div><div class="xyws-detailtitle" data-dtitle></div><div class="xyws-detailmeta" data-dmeta></div><div class="xyws-panel"><div class="xyws-detailbody" data-dbody></div></div><div class="xyws-person-install" data-person-install hidden><button class="xyws-primary" data-a="install-opening">＋ 加入开局名册</button><button class="xyws-primary" data-a="install-now">＋ 中途加入本局</button></div><button class="xyws-primary" data-a="install" data-single-install>＋ 加入本局</button><div class="xyws-actions"><button class="xyws-secondary" data-a="like">♡ 点赞</button><button class="xyws-secondary" data-a="fav">☆ 收藏</button><button class="xyws-secondary" data-a="export-work">⇩ 导出作品包</button><button class="xyws-secondary" data-a="edit-cloud" data-edit-cloud hidden>编辑作品</button><button class="xyws-secondary xyws-danger" data-a="delete-cloud" data-delete-cloud hidden>删除云端作品</button></div></section>'+
          '<section class="xyws-screen" data-screen="publish"><div class="xyws-hero"><small>✦ 发布作品</small><h3 data-pubtitle>发布作品</h3><p data-pubhint></p></div><div class="xyws-field" data-pubtype-wrap hidden><label>发布栏目</label><select data-pubtype><option value="角色">人物</option><option value="NPC">生灵 / 配角</option><option value="开局">开局</option><option value="规则">规则</option><option value="玩法">玩法</option><option value="装束">装束</option><option value="能力">能力</option><option value="物品">物品</option></select><div class="xyws-source" style="margin-top:6px">导入作品上传前可以改栏目；工坊会把原内容放进新栏目的正文 / 描述字段，再由你检查后发布。</div></div><button class="xyws-secondary" data-pick-open data-pickbtn style="margin-bottom:9px">选择发布内容</button><div class="xyws-field" data-pubname-wrap><label data-pubnamelabel>作品名称</label><input data-pubname></div><div class="xyws-field" data-pubsummary-wrap><label>简介（选填）</label><textarea data-pubsummary placeholder="建议 1～3 行；留空时工坊会自动生成一段短简介。"></textarea></div><div class="xyws-field" data-pubdesc-wrap><label data-pubdesclabel>内容</label><textarea data-pubdesc></textarea></div><div data-pubextra></div><div class="xyws-field"><label>标签（可选）</label><input data-pubtags placeholder="例如：校园、新人、经营"></div><button class="xyws-primary" data-a="publish" data-publish-btn>发布到云端</button></section>'+
          '<section class="xyws-screen" data-screen="importmap"><div class="xyws-hero"><small>⇧ 酒馆世界书</small><h3>选择导入栏目</h3><p>已识别 SillyTavern 世界书。不会再默认塞进“玩法”；先选目标栏目，再导入本地。</p></div><div class="xyws-field"><label>导入到哪个栏目</label><select data-import-target><option value="玩法">玩法</option><option value="开局">开局</option><option value="规则">规则</option><option value="装束">装束</option><option value="角色">人物</option><option value="NPC">生灵 / 配角</option><option value="能力">能力</option><option value="物品">物品</option></select></div><div class="xyws-panel"><h4 data-import-head>待导入世界书</h4><div class="xyws-muted" data-import-note></div></div><div class="xyws-checklist" data-import-items></div><div class="xyws-actions"><button class="xyws-secondary" data-a="import-cancel">取消</button><button class="xyws-primary" data-a="import-confirm">导入所选条目</button></div></section>'+
          '<section class="xyws-screen" data-screen="picksource"><div class="xyws-hero"><small>✦ 选择发布内容</small><h3 data-picktitle>选择来源</h3><p data-pickhint></p></div><div data-pickitems></div><div class="xyws-actions"><button class="xyws-secondary" data-a="pick-cancel">取消</button><button class="xyws-primary" data-a="pick-done">确定</button></div></section>'+
        '</div>'+
        '<div class="xyws-bottom"><div class="xyws-nav"><button class="on" data-nav="home">✦<br>首页</button><button data-nav="favorite">♡<br>收藏</button><button data-nav="create">＋<br>发布</button></div></div>'+
        '<input type="file" data-import-file accept=".json,application/json" hidden><div class="xyws-toast" data-toast></div><div class="xyws-resize-cue" title="拖动右下角调整工坊大小"></div></div>';
      doc.body.appendChild(overlay);
      try{var sh=overlay.querySelector('.xyws-shell');xywsLoadSize(sh);xywsWatchSize(sh);}catch(e){}
      bindOverlay();
      renderCats();
      renderHome();
      return overlay;
    }

    function $(sel){return overlay && overlay.querySelector(sel);}
    function $$(sel){return overlay?Array.prototype.slice.call(overlay.querySelectorAll(sel)):[];}

    function toast(t){var el=$('[data-toast]');if(!el)return;el.textContent=t;el.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.classList.remove('on');},1500);}
    function show(screen){
      ensureOverlay();
      if(currentScreen!==screen) prevScreen=currentScreen;
      currentScreen=screen;
      $$('[data-screen]').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-screen')===screen);});
      $$('[data-nav]').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-nav')===screen);});
      $('.xyws-bottom').style.display=(screen==='detail'||screen==='publish'||screen==='picksource'||screen==='importmap'||screen==='auth')?'none':'';
      $('.xyws-main').scrollTop=0;
      if(screen==='home') renderHome();
      if(screen==='favorite') renderFavs();
      if(screen==='mine') renderMine();
    }
    function xywsAuthApi(){
      try{if(typeof window!=='undefined'&&window.__XYWS_AUTH__)return window.__XYWS_AUTH__;}catch(e){}
      try{if(typeof globalThis!=='undefined'&&globalThis.__XYWS_AUTH__)return globalThis.__XYWS_AUTH__;}catch(e2){}
      return null;
    }
    function xywsLoggedIn(){
      var A=xywsAuthApi();
      return !!(A&&typeof A.isLoggedIn==='function'&&A.isLoggedIn());
    }
    function xywsManageApi(){
      try{if(typeof window!=='undefined'&&window.__XYWS_CLOUD_MANAGE__)return window.__XYWS_CLOUD_MANAGE__;}catch(e){}
      try{if(typeof globalThis!=='undefined'&&globalThis.__XYWS_CLOUD_MANAGE__)return globalThis.__XYWS_CLOUD_MANAGE__;}catch(e2){}
      return null;
    }
    function xywsManageOwnerSet(){
      var set={};(xywsManageWorks||[]).forEach(function(w){if(w&&w.xywsOriginId)set[String(w.xywsOriginId)]=1;});return set;
    }
    function xywsCanDeleteCloud(w){
      if(!w||!w.xywsCloud||!w.xywsOriginId||!xywsManageLoaded)return false;
      if(xywsManageIsAdmin)return true;
      return !!xywsManageOwnerSet()[String(w.xywsOriginId)];
    }
    function xywsCanEditCloud(w){
      if(!w||!w.xywsCloud||!w.xywsOriginId||!xywsManageLoaded)return false;
      return !!xywsManageOwnerSet()[String(w.xywsOriginId)];
    }
    function xywsMergedMine(){
      var out=[],seen={};
      (xywsManageWorks||[]).forEach(function(w){if(!w)return;var k=String(w.id||'');if(k&&!seen[k]){seen[k]=1;out.push(w);}});
      arr(LS_MINE).forEach(function(w){if(!w)return;var k=String(w.id||'');if(k&&!seen[k]){seen[k]=1;out.push(w);}});
      return out;
    }
    function xywsSyncManage(force){
      if(!xywsLoggedIn())return Promise.resolve(null);
      if(xywsManageLoading)return xywsManageLoading;
      if(xywsManageLoaded&&!force)return Promise.resolve({works:xywsManageWorks,isAdmin:xywsManageIsAdmin});
      var M=xywsManageApi();if(!M||typeof M.fetchMine!=='function')return Promise.resolve(null);
      xywsManageLoading=Promise.resolve(M.fetchMine()).then(function(r){
        xywsManageWorks=(r&&Array.isArray(r.works))?r.works:[];
        xywsManageIsAdmin=!!(r&&r.isAdmin);
        xywsManageLoaded=true;
        if(overlay&&overlay.classList.contains('on')){
          if(currentScreen==='mine')renderMine();
          else if(currentScreen==='detail'&&currentWork)openDetail(currentWork.id);
        }
        return r;
      }).catch(function(err){
        try{console.error('[XYWS Manage] sync failed:',err&&err.message?err.message:String(err));}catch(e){}
        return null;
      }).then(function(r){xywsManageLoading=false;return r;});
      return xywsManageLoading;
    }
    function xywsRemoveLocalMirror(originId){
      var id=String(originId||''),mine=arr(LS_MINE),next=mine.filter(function(w){return !(w&&(String(w.xywsOriginId||'')===id||String(w.id||'')==='cloud:'+id));});
      if(next.length!==mine.length)setLS(LS_MINE,JSON.stringify(next));
    }
    async function xywsDeleteCloudWork(originId,title){
      var id=String(originId||'').trim();if(!id){toast('作品 ID 无效');return false;}
      var ok=true;try{ok=win.confirm('确定删除《'+String(title||'这个作品')+'》？\n\n删除后云端会立即移除，当前工坊会自动刷新；其他已打开的客户端会自动同步（切回标签页时立即检查，前台最多约 30 秒），且无法撤销。');}catch(e){}
      if(!ok)return false;
      var M=xywsManageApi();if(!M||typeof M.deleteWork!=='function'){toast('云端作品管理模块未加载');return false;}
      try{
        await M.deleteWork(id);
        xywsManageWorks=(xywsManageWorks||[]).filter(function(w){return !(w&&String(w.xywsOriginId||'')===id);});
        xywsRemoveLocalMirror(id);
        WORKS=WORKS.filter(function(w){return !(w&&String(w.xywsOriginId||'')===id);});
        toast('云端作品已删除');
        await xywsRefreshCloud(true);
        await xywsSyncManage(true);
        return true;
      }catch(err){
        toast((err&&err.message)?err.message:'删除失败，请稍后重试');
        return false;
      }
    }
    function xywsReconcileCloudMirrors(publicWorks){
      if(!Array.isArray(publicWorks))return;
      var live={};
      publicWorks.forEach(function(w){if(w&&w.xywsOriginId)live[String(w.xywsOriginId)]=1;});
      var mine=arr(LS_MINE),changed=false;
      var next=mine.filter(function(w){
        if(w&&w.xywsCloud&&w.xywsOriginId&&!live[String(w.xywsOriginId)]){changed=true;return false;}
        return true;
      });
      if(changed)setLS(LS_MINE,JSON.stringify(next));
    }
    function xywsWorkshopVisible(){
      if(!overlay||!overlay.classList.contains('on')||!xywsLoggedIn())return false;
      try{if(doc.visibilityState&&doc.visibilityState!=='visible')return false;}catch(e){}
      return true;
    }
    async function xywsAutoSyncNow(reason){
      if(!xywsWorkshopVisible()||xywsAutoSyncBusy)return;
      xywsAutoSyncBusy=true;
      var detailId=(currentScreen==='detail'&&currentWork&&currentWork.xywsCloud)?String(currentWork.id||''):'';
      var detailOrigin=(currentScreen==='detail'&&currentWork&&currentWork.xywsOriginId)?String(currentWork.xywsOriginId||''):'';
      try{
        var publicWorks=await xywsRefreshCloud(true);
        if(Array.isArray(publicWorks))xywsReconcileCloudMirrors(publicWorks);
        await xywsSyncManage(true);
        if(detailId&&Array.isArray(publicWorks)){
          var stillThere=publicWorks.some(function(w){return w&&String(w.id||'')===detailId;});
          if(!stillThere){
            if(detailOrigin)xywsRemoveLocalMirror(detailOrigin);
            currentWork=null;
            toast('该作品已从云端删除，列表已自动同步');
            show('home');
            return;
          }
        }
        if(currentScreen==='home')renderHome();
        else if(currentScreen==='mine')renderMine();
      }catch(e){
        try{console.warn('[XYWS Sync] auto sync failed:',reason||'',e&&e.message?e.message:String(e));}catch(_e){}
      }finally{
        xywsAutoSyncBusy=false;
      }
    }
    function xywsStartAutoSync(){
      if(xywsAutoSyncTimer)return;
      xywsAutoSyncTimer=setInterval(function(){xywsAutoSyncNow('interval');},XYWS_AUTO_SYNC_MS);
    }
    function xywsStopAutoSync(){
      if(xywsAutoSyncTimer){clearInterval(xywsAutoSyncTimer);xywsAutoSyncTimer=null;}
      xywsAutoSyncBusy=false;
    }
    function xywsEnterHome(){
      xywsStartAutoSync();
      show('home');
      xywsRefreshCloud(false);
      xywsSyncManage(false);
    }
    function xywsEnterAuth(){
      xywsStopAutoSync();
      show('auth');
    }
    function xywsLockScroll(){
      try{ if(doc.documentElement){ xywsOldHtmlOverflow=String(doc.documentElement.style.overflow||''); doc.documentElement.style.overflow='hidden'; } }catch(e){}
      try{ xywsOldBodyOverflow=String(doc.body.style.overflow||''); doc.body.style.overflow='hidden'; }catch(e){}
    }
    function xywsUnlockScroll(){
      try{ if(doc.documentElement){ doc.documentElement.style.overflow=xywsOldHtmlOverflow; } }catch(e){}
      try{ doc.body.style.overflow=xywsOldBodyOverflow; }catch(e){}
      xywsOldHtmlOverflow='';
      xywsOldBodyOverflow='';
    }
    function open(){
      xywsInitPlayPacerBridge();ensureOverlay();try{var sh=overlay.querySelector('.xyws-shell');if(xywsIsMobile()){sh.style.width='';sh.style.height='';}else xywsLoadSize(sh);}catch(_e){}overlay.classList.add('on');xywsLockScroll();
      var A=xywsAuthApi();
      if(!A||typeof A.isLoggedIn!=='function'||!A.isLoggedIn()){xywsEnterAuth();return;}
      if(A.refreshIfNeeded&&typeof A.refreshIfNeeded==='function'){
        Promise.resolve(A.refreshIfNeeded()).then(function(ok){
          if(ok===false&&!A.isLoggedIn()){xywsEnterAuth();return;}
          xywsEnterHome();
        }).catch(function(){if(A.isLoggedIn())xywsEnterHome();else xywsEnterAuth();});
      }else{
        xywsEnterHome();
      }
    }
    function close(){xywsStopAutoSync();if(overlay)overlay.classList.remove('on');xywsUnlockScroll();}

    function card(w, rank, opts){
      var actions='<button class="xyws-mini" data-open="'+esc(w.id)+'">查看</button>';
      if(opts&&opts.canDelete&&w&&w.xywsCloud&&w.xywsOriginId)actions+='<button class="xyws-mini danger" data-delete-work="'+esc(w.xywsOriginId)+'" data-delete-title="'+esc(w.title||'')+'">删除</button>';
      if(opts&&opts.canEdit)actions+='<button class="xyws-mini" data-edit-work="'+esc(w.id)+'">编辑</button>';
      if(opts&&opts.canUpload)actions+='<button class="xyws-mini" data-upload-work="'+esc(w.id)+'">上传云端</button>';
      return '<article class="xyws-card" data-id="'+esc(w.id)+'"><div class="xyws-cardtop"><div class="xyws-orb">'+esc(w.icon||ICON[w.type]||'✦')+'</div><div class="xyws-cmain"><div class="xyws-title">'+(rank?'<span class="xyws-rank">'+rank+'</span>':'')+esc(w.title)+'</div><div class="xyws-desc">'+esc(xywsEnsureSummary(w))+'</div><div class="xyws-tags">'+(w.tags||[]).map(function(t){return '<span class="xyws-tag">'+esc(t)+'</span>';}).join('')+'</div></div></div><div class="xyws-foot"><div class="xyws-stats"><span>♡ '+fmt(w.likes)+'</span><span>下载 '+fmt(w.uses)+'</span></div><div class="xyws-card-actions">'+actions+'</div></div></article>';
    }
    function byId(id){
      for(var i=0;i<WORKS.length;i++)if(WORKS[i].id===id)return WORKS[i];
      for(var mi=0;mi<(xywsManageWorks||[]).length;mi++)if(xywsManageWorks[mi]&&xywsManageWorks[mi].id===id)return xywsManageWorks[mi];
      var mine=arr(LS_MINE);
      for(var j=0;j<mine.length;j++)if(mine[j]&&mine[j].id===id)return mine[j];
      var imported=arr(LS_IMPORTED);
      for(var k=0;k<imported.length;k++)if(imported[k]&&imported[k].id===id)return imported[k];
      return null;
    }
    function sorted(type){return WORKS.filter(function(w){return !type||w.type===type;}).slice().sort(function(a,b){return (b.likes||0)-(a.likes||0);});}

    function renderCats(){
      var cats=['热门','人物','生灵','开局','规则','玩法','装束','能力','物品','已启用'],box=$('[data-cats]');if(!box)return;
      var oldLeft=box.scrollLeft||0;box.innerHTML=cats.map(function(c){return '<button class="xyws-cat'+(c===currentCat?' on':'')+'" data-cat="'+c+'">'+c+'</button>';}).join('');box.scrollLeft=oldLeft;
      var on=box.querySelector('.xyws-cat.on');if(on){var l=on.offsetLeft,r=l+on.offsetWidth,vr=(box.scrollLeft||0)+box.clientWidth;if(l<box.scrollLeft||r>vr)box.scrollLeft=Math.max(0,l-Math.max(0,(box.clientWidth-on.offsetWidth)/2));}
    }
    function xywsCatToType(c){return c==='人物'?'角色':(c==='生灵'?'NPC':c);}
    function xywsPeopleSorted(){
      return WORKS.filter(function(w){return w&&((w.type==='角色')||(w.type==='NPC'));}).slice().sort(function(a,b){return (b.likes||0)-(a.likes||0);});
    }
    function xywsIsSupportNpc(w){
      return !!w && w.type==='NPC';
    }
    function renderHot(){
      var sections=[
        {title:'👤 热门人物',more:'人物',items:sorted('角色').slice(0,2)},
        {title:'✧ 热门生灵',more:'生灵',items:sorted('NPC').slice(0,2)},
        {title:'🎮 热门玩法',more:'玩法',items:sorted('玩法').slice(0,2)},
        {title:'🎬 热门开局',more:'开局',items:sorted('开局').slice(0,2)},
        {title:'📜 热门规则',more:'规则',items:sorted('规则').slice(0,2)},
        {title:'✦ 热门装束',more:'装束',items:sorted('装束').slice(0,2)},
        {title:'◇ 热门能力',more:'能力',items:sorted('能力').slice(0,2)},
        {title:'▣ 热门物品',more:'物品',items:sorted('物品').slice(0,2)}
      ],h='';
      sections.forEach(function(sec){
        if(!sec.items.length)return;
        h+='<section class="xyws-sec"><div class="xyws-sech"><b>'+sec.title+'</b><button class="xyws-more" data-more="'+sec.more+'">更多 ›</button></div><div class="xyws-cards">'+sec.items.map(function(w,i){return card(w,i+1);}).join('')+'</div></section>';
      });
      $('[data-hot]').innerHTML=h;
    }
    function renderNpcPage(){
      var all=xywsPeopleSorted(),people=all.filter(function(w){return !xywsIsSupportNpc(w);}),support=all.filter(xywsIsSupportNpc),h='';
      h+='<section class="xyws-sec"><div class="xyws-sech"><b>👤 人物</b><span style="font-size:9.5px;color:var(--ws-faint)">长期重要人物</span></div>';
      h+=people.length?'<div class="xyws-cards xyws-grid">'+people.map(function(w){return card(w);}).join('')+'</div>':'<div class="xyws-panel"><div class="xyws-muted">暂无人物 / NPC 作品。</div></div>';
      h+='</section>';
      h+='<section class="xyws-sec"><div class="xyws-sech"><b>✧ 生灵 / 配角</b><span style="font-size:9.5px;color:var(--ws-faint)">星灵 · 魔物 · 使魔 · 路人等轻量设定</span></div>';
      h+=support.length?'<div class="xyws-cards xyws-grid">'+support.map(function(w){return card(w);}).join('')+'</div>':'<div class="xyws-panel"><div class="xyws-muted">暂无其他配角作品。</div></div>';
      h+='</section>';
      $('[data-list]').innerHTML=h;
    }
    function renderList(type,q){
      var realType=type==='热门'?null:xywsCatToType(type),a=sorted(realType),qq=String(q||'').toLowerCase().trim();
      if(qq)a=a.filter(function(w){var alias=w.type==='NPC'?'生灵 NPC':(w.type==='角色'?'人物 角色':w.type);return (w.title+' '+w.desc+' '+(w.tags||[]).join(' ')+' '+alias).toLowerCase().indexOf(qq)>=0;});
      $('[data-list]').innerHTML='<div class="xyws-sech"><b>'+(qq?'搜索结果':(type+' · 热门排序'))+'</b><span style="font-size:9.5px;color:var(--ws-faint)">按点赞从高到低</span></div><div class="xyws-cards xyws-grid">'+a.map(function(w){return card(w);}).join('')+'</div>';
    }
    function renderEnabled(){
      var managed=xywsManagedItems(),onN=managed.filter(function(m){return m.on;}).length,h='';
      h+='<div class="xyws-panel"><h4>本局长期内容 · '+managed.length+'</h4><div class="xyws-muted">这里管理需要跨回合持续运行的规则与玩法。关闭＝暂时停止生效但保留；清除＝从本局彻底移除。当前开启 '+onN+' 项。</div>';
      if(managed.length){
        h+='<div class="xyws-managed">'+managed.map(function(m){return '<div class="xyws-managed-item'+(m.on?'':' off')+'"><div class="xyws-managed-icon">'+esc(m.icon)+'</div><div class="xyws-managed-copy"><b>'+esc(m.title)+'</b><span>'+esc(m.type+' · '+m.note+' · '+(m.on?'已开启':'已关闭'))+'</span></div><div class="xyws-managed-actions"><button data-mt="'+esc(m.type)+'" data-mid="'+esc(m.id)+'">'+(m.on?'关闭':'开启')+'</button><button class="danger" data-mr="'+esc(m.type)+'" data-mrid="'+esc(m.id)+'">清除</button></div></div>';}).join('')+'</div>';
      }else h+='<div class="xyws-muted" style="margin-top:9px">本局还没有安装需要长期追踪的规则或玩法。</div>';
      h+='</div>';
      h+='<div class="xyws-panel"><h4>说明</h4><div class="xyws-muted">人物/生灵、装束、能力、物品属于一次性安装；开局属于一次性写入聊天框，因此都不放进这个开启 / 关闭页面。</div></div>';
      $('[data-list]').innerHTML=h;
    }
    function renderHomeHero(q){
      var k=$('[data-home-kicker]'),t=$('[data-home-title]'),d=$('[data-home-desc]');if(!k||!t||!d)return;
      if(q){k.textContent='⌕ 在整片星海中检索';t.textContent='搜索结果';d.textContent='搜索会同时覆盖人物、生灵、开局、规则、玩法、装束、能力和物品。';return;}
      var map={
        '热门':['✦ 星图外的另一片夜空','社区热门','热门页按内容分区展示高赞作品。'],
        '人物':['👤 长期重要人物','人物','魔法少女、魔人、关键凡人等长期重要人物；安装后才会进入重要人物 / NPC 控制台。'],
        '生灵':['✧ 轻量配角与生灵','生灵 / 配角','星灵、魔物、使魔、灵兽、路人等轻量设定；只作为剧情设定加入，不写入重要人物变量。'],
        '开局':['🎬 命运的第一幕','开局','挑选一个开场，把它写入当前聊天输入框后再由玩家确认发送。'],
        '规则':['📜 世界追加规则','规则','安装后作为本局长期规则持续生效，可在“已启用”页统一开启、关闭或清除。'],
        '玩法':['🎮 文字玩法包','玩法','自然语言玩法会在本局跨回合持续执行，也可在“已启用”页管理。'],
        '装束':['✦ 变身后的第二层身份','装束','以整体描述为主；确有需要时再展开少量补充。'],
        '能力':['◇ 招式与能力档案','能力','直接填写现有招式五字段：档位、系别、类型、蓝耗、效果；名称可以留空自动生成。'],
        '物品':['▣ 行囊中的东西','物品','写清名称和作用即可；类别与数量可按需补充。'],
        '已启用':['✦ 本局运行中的追加层','已启用','集中整理已经安装的长期规则与玩法；关闭会保留，清除才会彻底移除。']
      },a=map[currentCat]||map['热门'];k.textContent=a[0];t.textContent=a[1];d.textContent=a[2];
    }
    function renderHome(){
      renderCats();
      var q=$('[data-q]')?$('[data-q]').value:'';
      renderHomeHero(q);
      if(q){$('[data-hot]').style.display='none';$('[data-list]').style.display='';renderList('热门',q);return;}
      if(currentCat==='热门'){$('[data-hot]').style.display='';$('[data-list]').style.display='none';renderHot();}
      else if(currentCat==='人物'||currentCat==='生灵'){$('[data-hot]').style.display='none';$('[data-list]').style.display='';renderList(currentCat,'');}
      else if(currentCat==='已启用'){$('[data-hot]').style.display='none';$('[data-list]').style.display='';renderEnabled();}
      else{$('[data-hot]').style.display='none';$('[data-list]').style.display='';renderList(currentCat,'');}
    }

    function xywsRuleTexts(w){
      var out=[];
      if(Array.isArray(w&&w.source))w.source.forEach(function(x){var t=(x&&typeof x==='object')?String(x.text||'').trim():(typeof x==='string'?String(x).trim():'');if(t&&out.indexOf(t)<0)out.push(t);});
      if(!out.length){var b=String((w&&(w.body||w.desc))||'').trim();if(b)out.push(b);}
      return out;
    }
    function xywsWorkBody(w){
      if(w&&w.type==='规则'){var rs=xywsRuleTexts(w);if(rs.length)return rs.map(function(x,i){return (rs.length>1?(i+1)+'. ':'')+x;}).join('\n\n');}
      if(w&&w.type==='装束'){var od=w.outfit||{};return String(od.description||w.body||w.desc||'');}
      if(w&&w.type==='能力'){var a=w.ability||{},lines=[];if(a.skillName)lines.push('招式名称：'+a.skillName);if(a.slot)lines.push('档位：'+a.slot);if(a.school)lines.push('系别 / 本能类别：'+a.school);if(a.skillType)lines.push('类型：'+a.skillType);if(a.mpCost!==undefined&&a.mpCost!==null&&a.mpCost!=='')lines.push('蓝耗：'+a.mpCost);if(a.effect)lines.push('效果：'+a.effect);return lines.join('\n');}
      if(w&&w.type==='物品'){var it=w.item||{},ls=[];if(it.category)ls.push('类别：'+it.category);ls.push('数量：'+(Number(it.quantity)||1));if(it.description)ls.push('作用 / 描述：'+it.description);return ls.join('\n');}
      if(w&&w.type==='角色'){var ps=xywsWorkNpcSources(w);if(ps.length)return ps.map(function(x){return xywsNpcRecordText(x.npc||x,x.notes);}).join('\n\n');}
      if(w&&w.type==='NPC'){var ss=xywsWorkSupportSources(w);if(ss.length)return ss.map(xywsSupportText).join('\n\n');}
      return String((w&&(w.body||w.desc))||'');
    }
    function xywsGeneratedSummary(w){
      if(!w)return '';
      if(w.type==='角色'){
        try{var src=xywsWorkNpcSources(w),one=src[0]||{},rec=one.npc||{},d=rec.档案||{},st=rec.状态||{},rel=rec.关系||{},nt=xywsNpcNotes(one.notes);var p=[d.种族,d.身份,d.能力系别,st.战服,rel.与主角关系,nt.personality,d.外貌].filter(Boolean).join(' · ');if(p)return xywsExcerpt(p,84);}catch(e){}
      }
      if(w.type==='NPC'){try{var sp=xywsWorkSupportSources(w)[0]||{};var pp=[xywsSupportKindLabel(sp.kind),sp.role,sp.personality,sp.ability,sp.relation].filter(Boolean).join(' · ');if(pp)return xywsExcerpt(pp,84);}catch(e2){}}
      if(w.type==='能力'){var a=w.ability||{},sa=[a.skillName,a.school,a.skillType,a.effect].filter(Boolean).join(' · ');if(sa)return xywsExcerpt(sa,84);}
      if(w.type==='物品'){var it=w.item||{},si=[it.category,(it.quantity?('×'+it.quantity):''),it.description].filter(Boolean).join(' · ');if(si)return xywsExcerpt(si,84);}
      if(w.type==='装束'){var od=w.outfit||{},so=String(od.description||w.body||'').trim();if(so)return xywsExcerpt(so,84);}
      var body='';try{body=xywsWorkBody(w);}catch(e3){body=String(w.body||'');}return xywsExcerpt(body||w.title||'未命名作品',84);
    }
    function xywsEnsureSummary(w){
      if(!w)return '';var s=String(w.desc||'').trim();if(!s)s=xywsGeneratedSummary(w);if(!s)s=xywsExcerpt(w.title||'未命名作品',84);w.desc=s;return s;
    }
    function xywsManagedStatus(w){
      if(!w)return null;
      var scope=xywsScopeId();
      if(w.type==='玩法'){
        var pp=xywsPlayLoad().filter(function(p){return p&&p.workId===w.id;});
        if(!pp.length)return null;return {on:pp.every(function(p){return p.on!==false;}),count:pp.length};
      }
      if(w.type==='规则'){
        var br=win.__XYSB_RULES_BRIDGE__,a=[];try{a=br&&br.load?br.load():arr('xysb_world_rules');}catch(e){}
        a=a.filter(function(r){return r&&r.xywsScope===scope&&r.xywsWorkId===w.id;});
        if(!a.length)return null;return {on:a.every(function(r){return r.on!==false;}),count:a.length};
      }
      return null;
    }
    function openDetail(id){
      var w=byId(id); if(!w)return; currentWork=w;
      var typeLabel=w.type==='NPC'?'生灵 / 配角':(w.type==='角色'?'人物':w.type);$('[data-dtype]').textContent=(w.icon||ICON[w.type]||'✦')+' '+typeLabel;$('[data-dtitle]').textContent=w.title;
      var authorLabel=w.xywsCloud?('云端'+(w.xywsAuthor?' · '+esc(w.xywsAuthor):'')):(w.xywsImported?('本地导入'+(w.xywsAuthor?' · '+esc(w.xywsAuthor):'')):(String(w.id||'').indexOf('mine_')===0?'我（本地测试）':'社区示例'));
      $('[data-dmeta]').innerHTML='<span>作者：'+authorLabel+'</span><span>♡ '+fmt(w.likes)+'</span><span>下载 '+fmt(w.uses)+'</span>';$('[data-dbody]').textContent=xywsWorkBody(w);
      var favs=arr(LS_FAV),liked=arr(LS_LIKED),ib=$('[data-a="install"]'),ms=xywsManagedStatus(w),important=w.type==='角色';$('[data-a="fav"]').textContent=favs.indexOf(w.id)>=0?'★ 已收藏':'☆ 收藏';$('[data-a="like"]').textContent=liked.indexOf(w.id)>=0?'♥ 已点赞':'♡ 点赞';
      var delBtn=$('[data-delete-cloud]');if(delBtn)delBtn.hidden=!xywsCanDeleteCloud(w);var editBtn=$('[data-edit-cloud]');if(editBtn)editBtn.hidden=!(w.xywsImported||String(w.id||'').indexOf('mine_')===0||xywsCanEditCloud(w));
      var pib=$('[data-person-install]'),sib=$('[data-single-install]');if(pib)pib.hidden=!important;if(sib)sib.style.display=important?'none':'';
      if(ib&&!important){if(w.type==='规则'||w.type==='玩法')ib.textContent=ms?(ms.on?'✓ 已持续启用':'＋ 重新启用'):'＋ 加入并持续启用';else if(w.type==='开局')ib.textContent='＋ 写入开局';else if(w.type==='装束')ib.textContent='＋ 写入变身装束';else if(w.type==='能力')ib.textContent='＋ 写入招式变量';else if(w.type==='物品')ib.textContent='＋ 加入背包';else if(w.type==='NPC')ib.textContent='＋ 加入本局（配角设定）';else ib.textContent='＋ 加入本局';}
      show('detail');
    }
    function toggleStore(key,id){
      var a=arr(key), i=a.indexOf(id); if(i>=0)a.splice(i,1);else a.push(id);setLS(key,JSON.stringify(a));return a.indexOf(id)>=0;
    }
    function xywsSetStoreState(key,id,on){
      var a=arr(key),i=a.indexOf(id);if(on&&i<0)a.push(id);else if(!on&&i>=0)a.splice(i,1);setLS(key,JSON.stringify(a));return on;
    }
    function xywsApplyCloudStats(w,likes,uses){
      if(!w||!w.xywsOriginId)return;var origin=String(w.xywsOriginId),hasLikes=likes!==undefined&&likes!==null,hasUses=uses!==undefined&&uses!==null;
      function apply(one){if(!one||String(one.xywsOriginId||'')!==origin)return;if(hasLikes)one.likes=Math.max(0,Number(likes)||0);if(hasUses)one.uses=Math.max(0,Number(uses)||0);}
      WORKS.forEach(apply);(xywsManageWorks||[]).forEach(apply);apply(currentWork);apply(w);
      var mine=arr(LS_MINE),changed=false;mine.forEach(function(one){if(one&&String(one.xywsOriginId||'')===origin){apply(one);changed=true;}});if(changed)setLS(LS_MINE,JSON.stringify(mine));
    }
    async function xywsToggleCloudLike(w,button){
      var M=xywsManageApi();if(!M||typeof M.setLike!=='function'){toast('云端点赞计数后端还没更新；当前没有伪造本地数字');return false;}
      var liked=arr(LS_LIKED).indexOf(w.id)>=0,next=!liked,oldText=button?button.textContent:'';if(button){button.disabled=true;button.textContent=next?'点赞中…':'取消中…';}
      try{
        var r=await M.setLike(w.xywsOriginId,next),serverLiked=r&&typeof r.liked==='boolean'?r.liked:next;
        xywsSetStoreState(LS_LIKED,w.id,serverLiked);xywsApplyCloudStats(w,r&&r.likes!==undefined?r.likes:(Math.max(0,(Number(w.likes)||0)+(serverLiked?1:-1))),undefined);
        if(currentScreen==='detail'&&currentWork)openDetail(currentWork.id);else if(currentScreen==='home')renderHome();
        toast(serverLiked?'已点赞':'已取消点赞');return true;
      }catch(err){toast((err&&err.message)||'云端点赞失败');return false;}
      finally{if(button&&doc.body.contains(button)){button.disabled=false;button.textContent=oldText;}}
    }
    function xywsTrackCloudDownload(w){
      if(!w||!w.xywsCloud||!w.xywsOriginId)return Promise.resolve(false);var M=xywsManageApi();if(!M||typeof M.recordDownload!=='function')return Promise.resolve(false);
      return Promise.resolve(M.recordDownload(w.xywsOriginId)).then(function(r){xywsApplyCloudStats(w,undefined,r&&r.uses!==undefined?r.uses:(Number(w.uses)||0)+1);if(currentScreen==='detail'&&currentWork&&String(currentWork.xywsOriginId||'')===String(w.xywsOriginId))openDetail(currentWork.id);else if(currentScreen==='home')renderHome();return true;}).catch(function(err){try{console.error('[XYWS Manage] download count failed:',err&&err.message?err.message:String(err));}catch(e){}return false;});
    }
    function rememberInstalled(w){
      if(!w)return;
      var a=arr(LS_INST); if(a.indexOf(w.id)<0)a.push(w.id); setLS(LS_INST,JSON.stringify(a));
    }
    function xywsResolveMvu(){
      var c=[];
      try{c.push(win.Mvu);}catch(e){}
      try{c.push(window.Mvu);}catch(e2){}
      try{c.push(window.parent&&window.parent.Mvu);}catch(e3){}
      try{c.push(window.top&&window.top.Mvu);}catch(e4){}
      for(var i=0;i<c.length;i++)if(c[i]&&typeof c[i].getMvuData==='function'&&typeof c[i].replaceMvuData==='function')return c[i];
      return null;
    }
    function xywsClone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return null;}}
    function xywsSexAge(v){
      var s=String(v||'').trim(), sex='', age=0, m=s.match(/(\d{1,4})/);
      if(m)age=Number(m[1])||0;
      if(/女/.test(s))sex='女'; else if(/男/.test(s))sex='男'; else if(/无性|不定/.test(s))sex='待定';
      return {sex:sex||'待定',age:age};
    }
    function xywsRankWord(s,kind){
      s=String(s||'');
      var pool=kind==='demon'?['孳生体','蚀魂者','化渊者','噬星者','渊厄']:['见习','正式','精英','战姬','传奇'];
      for(var i=0;i<pool.length;i++)if(s.indexOf(pool[i])>=0)return pool[i];
      return '';
    }
    function xywsNpcNum(v,d){var n=Number(v);return Number.isFinite(n)?n:(d==null?0:d);}
    function xywsNpcObj(v){return (v&&typeof v==='object'&&!Array.isArray(v))?v:{};}
    function xywsNpcNotes(v){
      v=xywsNpcObj(v);var out={},keys=['personality','speech','background','motivation','habits','weakness','combatStyle','origin','freeform'];keys.forEach(function(k){var x=String(v[k]||'').trim();if(x)out[k]=x;});return out;
    }
    function xywsNpcNotesAny(v){return Object.keys(xywsNpcNotes(v)).length>0;}
    function xywsNpcNarrativeText(notes){
      notes=xywsNpcNotes(notes);var L=[],map=[['personality','性格与行为'],['speech','说话方式 / 口癖'],['background','背景经历'],['motivation','目标 / 动机'],['habits','习惯 / 偏好'],['weakness','弱点 / 忌讳 / 边界'],['combatStyle','战斗风格 / 行动偏好'],['origin','本源 / 核心叙事设定'],['freeform','待分类补充设定']];
      map.forEach(function(x){if(notes[x[0]])L.push(x[1]+'：'+notes[x[0]]);});return L.join('\n');
    }
    function xywsNpcNarrativePrompt(name,notes){
      var t=xywsNpcNarrativeText(notes);if(!t)return '';
      return '【星海工坊·人物补充叙事设定】\n人物：'+String(name||'未命名人物')+'\n'+t+'\n\n分类约束：以上是叙事硬设定，不要为了“有地方存”而塞进关系.钩子或关系.秘密；钩子只保存真正的剧情伏笔/待办，秘密只保存角色确实隐瞒的事实。若当前合法 MVU 没有对应专栏，则保留在叙事上下文中，不伪造字段。';
    }
    function xywsNpcRaceForKind(kind){return kind==='mahou'?'魔法少女':(kind==='demon'?'魔人':(kind==='mortal'?'凡人':''));}
    function xywsNpcKindFromRecord(rec,fallback){
      var d=xywsNpcObj(rec&&rec.档案),text=[d.种族,d.身份,d.阵营].join(' ');
      if(/魔人|魔物|魔族|恶魔|深渊|渊裔|寄生体|化形种|原生种/.test(text))return 'demon';
      if(/魔法少女|守护者|星裔|契约者|战姬/.test(text))return 'mahou';
      if(/凡人|普通人|人类|学生|教师|医生|研究员|上班族/.test(text))return 'mortal';
      return /^(mahou|demon|mortal|other)$/.test(String(fallback||''))?String(fallback):'other';
    }
    function xywsNpcSanitizeMap(o,shape){
      var src=xywsNpcObj(o),out={};Object.keys(src).forEach(function(k){
        if(!k||k==='$meta'||String(k).indexOf('$__')===0)return;
        var v=xywsNpcObj(src[k]),row={};shape.forEach(function(f){if(v[f]!==undefined&&v[f]!==null&&String(v[f]).trim()!=='')row[f]=v[f];});
        if(Object.keys(row).length)out[k]=row;
      });return out;
    }
    function xywsSanitizeNpcRecord(raw,kind){
      raw=xywsNpcObj(raw);kind=xywsNpcKindFromRecord(raw,kind);var d=xywsNpcObj(raw.档案),war=xywsNpcObj(raw.战力),st=xywsNpcObj(raw.状态),co=xywsNpcObj(raw.侵蚀),sp=xywsNpcObj(raw.星灵),rel=xywsNpcObj(raw.关系);
      var rec={
        档案:{姓名:String(d.姓名||'').trim(),代号:String(d.代号||'').trim(),性别:String(d.性别||'').trim(),种族:String(d.种族||xywsNpcRaceForKind(kind)).trim(),真实年龄:xywsNpcNum(d.真实年龄,0),表观年龄:xywsNpcNum(d.表观年龄,0),身份:String(d.身份||'').trim(),阵营:String(d.阵营||'').trim(),能力系别:String(d.能力系别||'').trim(),亲和体质:String(d.亲和体质||'').trim(),契龄:xywsNpcNum(d.契龄,0),外貌:String(d.外貌||'').trim()},
        战力:{等级:xywsNpcNum(war.等级,0),经验:xywsNpcNum(war.经验,0),层级声明:String(war.层级声明||war._阶级||war._位格||'').trim()},
        状态:{生命:xywsNpcNum(st.生命,100),魔力:xywsNpcNum(st.魔力,kind==='mortal'?0:100),情欲:xywsNpcNum(st.情欲,0),变身:/变身中|已变身|现形/.test(String(st.变身||''))?'变身中':'日常态',战服:String(st.战服||'').trim(),处境:String(st.处境||'').trim(),战况:String(st.战况||'无战事').trim()||'无战事',伤势:xywsNpcObj(st.伤势),位置:String(st.位置||'').trim()},
        侵蚀:{阶段:['未染','初蚀','沉沦','半堕','恶堕'].indexOf(String(co.阶段||''))>=0?String(co.阶段):'未染',侵蚀值:xywsNpcNum(co.侵蚀值,0)},
        星灵:{名号:String(sp.名号||'').trim(),本相:String(sp.本相||'').trim(),现状:String(sp.现状||'').trim(),蚀相:String(sp.蚀相||'').trim(),言语:['可言语','不言语'].indexOf(String(sp.言语||''))>=0?String(sp.言语):'',羁绊:xywsNpcNum(sp.羁绊,0),羁绊描述:String(sp.羁绊描述||'').trim()},
        躯体:xywsNpcSanitizeMap(raw.躯体,['白描','变身装甲']),
        星器:xywsNpcSanitizeMap(raw.星器,['类型','品阶','契合','效果']),
        招式:xywsNpcSanitizeMap(raw.招式,['档位','系别','类型','蓝耗','效果']),
        背包:xywsNpcSanitizeMap(raw.背包,['数量','类别','描述']),
        金钱:xywsNpcNum(raw.金钱,0),
        关系:{与主角关系:String(rel.与主角关系||'').trim(),好感度:xywsNpcNum(rel.好感度,0),钩子:String(rel.钩子||'').trim(),秘密:String(rel.秘密||'').trim(),最后出场:String(rel.最后出场||'').trim()}
      };
      Object.keys(rec.招式).forEach(function(k){var a=rec.招式[k];a.蓝耗=xywsNpcNum(a.蓝耗,0);});
      Object.keys(rec.背包).forEach(function(k){var it=rec.背包[k];it.数量=Math.max(0,Math.round(xywsNpcNum(it.数量,0)));});
      return rec;
    }
    function xywsNpcSourceFromRecord(rec,kind,debut,notes){rec=xywsSanitizeNpcRecord(rec,kind);return {kind:xywsNpcKindFromRecord(rec,kind),name:String(rec.档案.姓名||'').trim(),debut:String(debut||'').trim(),include:true,npc:rec,notes:xywsNpcNotes(notes)};}
    function xywsNpcRecordText(rec,notes){
      rec=xywsSanitizeNpcRecord(rec);var L=[];function add(k,v){if(v!==undefined&&v!==null&&String(v).trim()!==''&&!(typeof v==='number'&&v===0))L.push(k+'：'+String(v));}
      var d=rec.档案,w=rec.战力,st=rec.状态,co=rec.侵蚀,r=rec.关系;
      add('姓名',d.姓名);add('代号',d.代号);add('性别',d.性别);add('种族',d.种族);if(d.真实年龄)add('年龄',d.真实年龄);add('身份 / 职业',d.身份);add('阵营',d.阵营);add('能力系别 / 本能',d.能力系别);add('外貌',d.外貌);
      add('等级',w.等级);if(w.层级声明)add('阶级 / 位格（旧数据兼容）',w.层级声明);add('当前装束 / 武装',st.战服);add('当前处境',st.处境);add('位置',st.位置);if(co.阶段&&co.阶段!=='未染')add('侵蚀阶段',co.阶段);add('与主角关系',r.与主角关系);add('剧情钩子',r.钩子);add('秘密',r.秘密);
      var nt=xywsNpcNarrativeText(notes);if(nt)L.push('叙事设定：\n'+nt);
      var legacy=[];if(Object.keys(rec.招式||{}).length)legacy.push('已有招式 '+Object.keys(rec.招式).length+' 项');if(Object.keys(rec.星器||{}).length)legacy.push('已有星器 '+Object.keys(rec.星器).length+' 项');if(Object.keys(rec.背包||{}).length)legacy.push('已有背包物品 '+Object.keys(rec.背包).length+' 项');if(Object.keys(rec.躯体||{}).length)legacy.push('已有躯体细分 '+Object.keys(rec.躯体).length+' 项');if(legacy.length)L.push('旧版兼容数据：'+legacy.join(' · '));
      return L.join('\n');
    }
    function xywsProfileToNpcSource(raw,w){
      raw=xywsNpcObj(raw);var st=xywsNpcObj(raw.state),role=String(st.role||''),demon=role==='demon'?true:(role==='mahou'?false:/魔人|魔物|深渊/.test([w&&w.title,w&&w.desc,w&&w.body,(w&&w.tags||[]).join(' ')].join(' '))),kind=demon?'demon':'mahou';
      var name=String((demon?(st.demon_name||st.demon_title):(st.name||st.title))||raw.name||(w&&w.title)||'工坊人物').trim()||'工坊人物';
      var rec=xywsSanitizeNpcRecord({
        档案:{姓名:name,代号:demon?String(st.demon_title||''):String(st.title||''),性别:demon?String(st.demon_gender||''):'',种族:demon?String(st.demon_kind||'魔人'):'魔法少女',真实年龄:demon?xywsNpcNum(st.demon_age,0):xywsNpcNum(st.age,0),表观年龄:demon?xywsNpcNum(st.demon_age,0):xywsNpcNum(st.age,0),身份:demon?String(st.demon_identity||''):String(st.identity||''),阵营:demon?String(st.demon_camp||''):String(st.camp||''),能力系别:demon?String(st.demon_power||''):String(st.power||''),亲和体质:'',契龄:0,外貌:String(st.look||'')},
        战力:{等级:0,经验:0,层级声明:demon?String(st.demon_tier||''):String(st.rank||'')},
        状态:{生命:100,魔力:demon?100:100,情欲:0,变身:'日常态',战服:'',处境:'',战况:'无战事',伤势:{},位置:''},
        侵蚀:{阶段:demon?'未染':String(st.corruption_stage||'未染'),侵蚀值:0},
        星灵:demon?{}:{名号:'',本相:String(st.astral_form||''),现状:'',蚀相:'',言语:String(st.astral_voice||''),羁绊:0,羁绊描述:String(st.astral_relation||'')},
        躯体:{变身外观:{白描:String(st.look||''),变身装甲:demon?String(st.demon_outfit||''):String(st.mahou_outfit||'')}},
        星器:{},招式:{},背包:{},金钱:0,
        关系:{与主角关系:'',好感度:0,钩子:'',秘密:'',最后出场:''}
      },kind);
      var notes=xywsNpcNotes({personality:String(demon?st.demon_trait:st.trait||''),origin:String(demon?st.demon_origin:'').trim(),freeform:String(st.notes||st.note||'').trim()});
      return xywsNpcSourceFromRecord(rec,kind,demon?String(st.demon_plot||''):String(st.route||''),notes);
    }
    function xywsDefaultNpcSource(w){
      var text=[w&&w.title,w&&w.desc,w&&w.body,(w&&w.tags||[]).join(' '),w&&w.subtype].join(' '),kind='mortal',race='凡人';
      if(/魔人|魔物|魔兽|怪物|深渊|恶魔/.test(text)){kind='demon';race=/魔物|魔兽|怪物/.test(text)?'魔物':'魔人';}
      else if(/星灵|使魔|灵兽|宠物|召唤物/.test(text)){kind='other';race=/星灵/.test(text)?'星灵':(/使魔/.test(text)?'使魔':'异种生命');}
      else if((w&&w.type)==='角色'||/魔法少女|守护者|学姐|学妹|战姬|治愈系|能力系/.test(text)){kind='mahou';race='魔法少女';}
      var rec=xywsSanitizeNpcRecord({档案:{姓名:String((w&&w.title)||'工坊人物').trim()||'工坊人物',种族:race,身份:race,外貌:''},状态:{生命:100,魔力:kind==='mortal'?0:100,变身:'日常态',战况:'无战事',处境:'已由星海工坊加入·待登场'},关系:{与主角关系:'工坊追加人物',钩子:'',秘密:''}},kind);
      return xywsNpcSourceFromRecord(rec,kind,'',{freeform:String((w&&(w.body||w.desc))||'').trim()});
    }
    function xywsNormalizeNpcSource(raw,w){
      if((w&&w.type)==='角色'&&raw&&typeof raw==='object'&&raw.state)return xywsProfileToNpcSource(raw,w);
      if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
        if(raw.npc&&raw.npc.档案)return xywsNpcSourceFromRecord(raw.npc,raw.kind,raw.debut,raw.notes);
        if(raw.档案&&raw.关系)return xywsNpcSourceFromRecord(raw,raw.kind,raw.debut,raw.notes);
        var d=xywsDefaultNpcSource(w),rec=d.npc,kind=/^(mahou|demon|mortal|other)$/.test(String(raw.kind||''))?String(raw.kind):d.kind,sa=xywsSexAge(raw.sexage),nm=String(raw.name||(w&&w.title)||'工坊人物').trim()||'工坊人物';
        rec.档案.姓名=nm;rec.档案.性别=sa.sex==='待定'?'':sa.sex;rec.档案.真实年龄=sa.age;rec.档案.表观年龄=sa.age;rec.档案.种族=kind==='mahou'?'魔法少女':(kind==='demon'?String(raw.type||'魔人'):(kind==='mortal'?'凡人':String(raw.type||'异种生命')));rec.档案.身份=kind==='mortal'?String(raw.job||''):String(raw.type||rec.档案.种族);rec.档案.阵营=String(raw.camp||'');rec.档案.能力系别=String(raw.power||raw.skill||'');rec.档案.外貌=String(raw.look||'');
        rec.战力.层级声明=String(raw.threat||raw.rank||'');var lm=String(raw.rank||'').match(/(?:Lv\.?\s*)?(\d{1,3})/i);rec.战力.等级=lm?Number(lm[1])||0:0;rec.侵蚀.阶段=kind==='mahou'&&['未染','初蚀','沉沦','半堕','恶堕'].indexOf(String(raw.corr||''))>=0?String(raw.corr):'未染';rec.关系.与主角关系=String(raw.rel||'');rec.关系.钩子=String(raw.hook||'');
        if(kind==='mahou'&&raw.star){rec.星器[String(raw.star)]={类型:'',品阶:'寻常',契合:'初缔',效果:''};}
        return xywsNpcSourceFromRecord(rec,kind,raw.debut,raw.notes);
      }
      return xywsDefaultNpcSource(w);
    }
    function xywsSupportKindLabel(k){return {spirit:'星灵',monster:'魔物',familiar:'使魔',beast:'灵兽 / 异种生物',mortal:'普通人 / 路人',other:'其他配角'}[String(k||'')]||'其他配角';}
    function xywsSupportKindGuess(text){text=String(text||'');if(/星灵/.test(text))return 'spirit';if(/使魔|召唤物|宠物/.test(text))return 'familiar';if(/灵兽|魔兽|异兽/.test(text))return 'beast';if(/魔物|怪物|恶魔|深渊生物/.test(text))return 'monster';if(/凡人|普通人|路人|学生|店员|记者|居民/.test(text))return 'mortal';return 'other';}
    function xywsNormalizeSupportSource(raw,w){
      raw=xywsNpcObj(raw);var simple=raw.support&&typeof raw.support==='object'?xywsNpcObj(raw.support):raw;
      if(simple.kind&&simple.name&&!simple.npc&&!simple.档案){return {kind:String(simple.kind||'other'),name:String(simple.name||'').trim(),role:String(simple.role||'').trim(),appearance:String(simple.appearance||'').trim(),personality:String(simple.personality||'').trim(),ability:String(simple.ability||'').trim(),relation:String(simple.relation||'').trim(),debut:String(simple.debut||'').trim(),notes:String(simple.notes||'').trim(),include:simple.include!==false};}
      var src=xywsNormalizeNpcSource(raw,w||{type:'NPC',title:''}),rec=src.npc||{},d=rec.档案||{},rel=rec.关系||{},nt=xywsNpcNotes(src.notes),skillNames=Object.keys(rec.招式||{}).slice(0,3),skill=skillNames.map(function(n){var a=rec.招式[n]||{};return n+(a.效果?'：'+a.效果:'');}).join('；'),notes=[];
      [['背景',nt.background],['动机',nt.motivation],['习惯',nt.habits],['弱点',nt.weakness],['战斗方式',nt.combatStyle],['核心设定',nt.origin],['补充',nt.freeform],['剧情钩子',rel.钩子],['秘密',rel.秘密]].forEach(function(x){if(x[1])notes.push(x[0]+'：'+x[1]);});
      var text=[d.种族,d.身份,d.阵营,w&&w.title].filter(Boolean).join(' ');
      return {kind:xywsSupportKindGuess(text),name:String(d.姓名||src.name||(w&&w.title)||'未命名生灵').trim(),role:[d.种族,d.身份,d.阵营].filter(Boolean).join(' · '),appearance:String(d.外貌||'').trim(),personality:String(nt.personality||nt.speech||'').trim(),ability:[d.能力系别,skill].filter(Boolean).join('；'),relation:String(rel.与主角关系||'').trim(),debut:String(src.debut||'').trim(),notes:notes.join('\n'),include:src.include!==false};
    }
    function xywsWorkSupportSources(w){var src=(Array.isArray(w&&w.source)&&w.source.length)?w.source:[{}],out=[];for(var i=0;i<src.length;i++)out.push(xywsNormalizeSupportSource(src[i],w));return out;}
    function xywsSupportText(p){p=xywsNormalizeSupportSource(p,{type:'NPC',title:p&&p.name});var L=['类型：'+xywsSupportKindLabel(p.kind)];function add(k,v){if(String(v||'').trim())L.push(k+'：'+String(v).trim());}add('名称',p.name);add('定位 / 身份',p.role);add('外貌',p.appearance);add('性格 / 行为',p.personality);add('能力 / 危险点',p.ability);add('与主角关系 / 用途',p.relation);add('登场方式',p.debut);add('补充',p.notes);return L.join('\n');}
    function xywsInstallSupport(w){var src=xywsWorkSupportSources(w);if(!src.length)return {ok:false,msg:'这个生灵 / 配角没有可用内容'};var blocks=src.map(function(p){return '【星海工坊·生灵 / 配角设定】\n'+xywsSupportText(p)+'\n\n【使用约束】这是轻量配角 / 生灵设定：不要写入 /重要人物，不进入 NPC 控制台，不新建 MVU 字段。按剧情需要临时使用即可；如果以后要把其中某个角色升格为长期重要人物，请玩家另存为“人物”作品。';});if(!xywsWriteToChat(blocks.join('\n\n')))return {ok:false,msg:'没有找到酒馆聊天输入框'};return {ok:true,msg:'生灵 / 配角设定已写入聊天框；它不会进入重要人物变量，请检查后发送'};}
    function xywsWorkNpcSources(w){
      var src=(Array.isArray(w&&w.source)&&w.source.length)?w.source:[null],out=[];for(var i=0;i<src.length;i++)out.push(xywsNormalizeNpcSource(src[i],w));return out;
    }
    function xywsNpcRecord(p,w){
      p=(p&&typeof p==='object'&&!Array.isArray(p))?p:{};if(p.npc&&p.npc.档案)return xywsSanitizeNpcRecord(p.npc,p.kind);if(p.档案&&p.关系)return xywsSanitizeNpcRecord(p,p.kind);return xywsNormalizeNpcSource(p,w).npc;
    }
    function xywsUniqueNpcKey(map,name){
      if(!Object.prototype.hasOwnProperty.call(map,name))return name;
      var base=name+'（工坊）'; if(!Object.prototype.hasOwnProperty.call(map,base))return base;
      var n=2; while(Object.prototype.hasOwnProperty.call(map,base+n))n++;
      return base+n;
    }
    async function xywsInstallNpc(w){
      var M=xywsResolveMvu();if(!M)return {ok:false,msg:'没有找到 MVU 写入接口；请确认 MVU / 酒馆助手已正常加载'};
      var opt={type:'message',message_id:'latest'},oldData=null;try{oldData=M.getMvuData(opt);}catch(e){}
      if(!oldData||!oldData.stat_data)return {ok:false,msg:'当前楼层还没有可写入的 MVU 数据'};
      var next=xywsClone(oldData);if(!next||!next.stat_data)return {ok:false,msg:'复制当前 MVU 数据失败'};
      if(!next.stat_data.重要人物||typeof next.stat_data.重要人物!=='object'||Array.isArray(next.stat_data.重要人物))next.stat_data.重要人物={};
      var src=xywsWorkNpcSources(w),names=[],noteBlocks=[];
      for(var i=0;i<src.length;i++){
        var rec=xywsNpcRecord(src[i],w),base=String(rec.档案.姓名||'').trim();
        if(!base){return {ok:false,msg:'人物姓名为空，无法直接建立 /重要人物/<姓名>；请先补名后再安装'};}
        var key=xywsUniqueNpcKey(next.stat_data.重要人物,base);rec.档案.姓名=key;if(!rec.状态.处境)rec.状态.处境='已由星海工坊加入·待登场';next.stat_data.重要人物[key]=rec;names.push(key);
        var nb=xywsNpcNarrativePrompt(key,src[i]&&src[i].notes);if(nb)noteBlocks.push(nb);
      }
      try{await M.replaceMvuData(next,opt);}catch(ex){return {ok:false,msg:'MVU 写入失败：'+(ex&&ex.message?ex.message:'未知错误')};}
      var noteWritten=noteBlocks.length?xywsWriteToChat(noteBlocks.join('\n\n')):false;
      return {ok:true,msg:'已加入长期重要人物：'+names.join('、')+(noteBlocks.length?(noteWritten?'；补充叙事设定已写入聊天框，请检查后发送':'；该作品另含叙事设定，但当前没有找到聊天输入框'):'')};
    }
    function xywsResolveOpeningRosterBridge(){
      var cand=[];
      try{cand.push(win.__XYWS_OPENING_ADD_ROSTER__);}catch(e){}
      try{cand.push(window.__XYWS_OPENING_ADD_ROSTER__);}catch(e2){}
      try{cand.push(window.parent&&window.parent.__XYWS_OPENING_ADD_ROSTER__);}catch(e3){}
      try{cand.push(window.top&&window.top.__XYWS_OPENING_ADD_ROSTER__);}catch(e4){}
      for(var i=0;i<cand.length;i++)if(typeof cand[i]==='function')return cand[i];
      try{
        var fs=doc.querySelectorAll('iframe');
        for(var j=0;j<fs.length;j++){var cw=fs[j].contentWindow;if(cw&&typeof cw.__XYWS_OPENING_ADD_ROSTER__==='function')return cw.__XYWS_OPENING_ADD_ROSTER__;}
      }catch(e5){}
      return null;
    }
    function xywsInstallNpcOpening(w){
      var items=xywsWorkNpcSources(w),fn=xywsResolveOpeningRosterBridge();
      if(fn){
        try{var r=fn(items);if(r&&r.ok!==false)return {ok:true,msg:'已加入开局人物名册：'+((r.names&&r.names.join('、'))||items.map(function(x){return x.name;}).join('、'))};if(r&&r.msg)return r;}catch(e){return {ok:false,msg:'开场白人物名册写入失败：'+(e&&e.message?e.message:'未知错误')};}
      }
      // 兜底：同源环境下直接写本地名册；开场白重新打开后会读取。
      try{
        var a=JSON.parse(getLS('star_pact_cur_v5_roster','[]'));if(!Array.isArray(a))a=[];
        var used={};a.forEach(function(p){var nm=p&&p.npc&&p.npc.档案?p.npc.档案.姓名:(p&&p.name);if(nm)used[String(nm)]=1;});
        items.forEach(function(p){p=xywsClone(p)||{};var name=String((p.npc&&p.npc.档案&&p.npc.档案.姓名)||p.name||'工坊人物'),base=name,n=2;while(used[name])name=base+'（工坊'+(n>2?n:'')+'）',n++;used[name]=1;p.name=name;if(p.npc&&p.npc.档案)p.npc.档案.姓名=name;p.include=true;a.push(p);});
        setLS('star_pact_cur_v5_roster',JSON.stringify(a));
        return {ok:true,msg:'已写入开局名册存档；重新打开开场白后可见'};
      }catch(e2){return {ok:false,msg:'没有找到开场白名册桥接；请先使用新版轻量开场白入口'};}
    }
    function xywsOpeningText(w){
      if(Array.isArray(w.source)&&w.source.length){
        for(var i=0;i<w.source.length;i++)if(typeof w.source[i]==='string'&&String(w.source[i]).trim())return String(w.source[i]).trim();
      }
      return String(w.body||w.desc||'').trim();
    }
    function xywsInstallOpening(w){
      var txt=xywsOpeningText(w); if(!txt)return {ok:false,msg:'这个开局没有可导入的文本'};
      var ta=doc.getElementById('send_textarea'); if(!ta)return {ok:false,msg:'没有找到酒馆聊天输入框'};
      var block='【星海工坊·开局】\n'+txt, cur=String(ta.value||'');
      ta.value=cur.trim()?cur.replace(/\s+$/,'')+'\n\n'+block:block;
      try{ta.dispatchEvent(new win.Event('input',{bubbles:true}));}catch(e){try{ta.dispatchEvent(new Event('input',{bubbles:true}));}catch(_){}}
      try{ta.dispatchEvent(new win.Event('change',{bubbles:true}));}catch(e2){}
      try{ta.focus();ta.selectionStart=ta.selectionEnd=ta.value.length;}catch(e3){}
      return {ok:true,msg:'开局已写入聊天框，请检查后发送'};
    }
    function xywsSaveRulesAll(a){
      var br=win.__XYSB_RULES_BRIDGE__;
      if(br&&typeof br.save==='function'){try{br.save(a);return true;}catch(e){}}
      setLS('xysb_world_rules',JSON.stringify(a||[]));
      try{if(br&&typeof br.sync==='function')br.sync();}catch(e2){}
      return true;
    }
    function xywsLoadRulesAll(){
      var br=win.__XYSB_RULES_BRIDGE__;try{if(br&&typeof br.load==='function')return br.load()||[];}catch(e){}
      try{var a=JSON.parse(getLS('xysb_world_rules','[]'));return Array.isArray(a)?a:[];}catch(e2){return[];}
    }
    function xywsSkillMaxSlot(data){
      var s=(data&&data.stat_data)||{},war=(s.主角&&s.主角.战力)||{},decl=String([war.层级声明,war._阶级,war._位格].filter(Boolean).join(' ')),lv=Math.max(1,Number(war.等级)||1),tier='见习';
      if(/传奇|渊厄/.test(decl)||lv>=56)tier='传奇';
      else if(/战姬|噬星者/.test(decl)||lv>=41)tier='战姬';
      else if(/精英|化渊者/.test(decl)||lv>=26)tier='精英';
      else if(/正式|蚀魂者/.test(decl)||lv>=11)tier='正式';
      return {tier:tier,max:{'见习':'小技能','正式':'中技能','精英':'大技能','战姬':'领域','传奇':'规则级'}[tier]||'小技能'};
    }
    function xywsWriteToChat(block){
      var ta=doc.getElementById('send_textarea');if(!ta)return false;
      var cur=String(ta.value||'');ta.value=cur.trim()?cur.replace(/\s+$/,'')+'\n\n'+block:block;
      try{ta.dispatchEvent(new win.Event('input',{bubbles:true}));}catch(e){try{ta.dispatchEvent(new Event('input',{bubbles:true}));}catch(_){} }
      try{ta.focus();ta.selectionStart=ta.selectionEnd=ta.value.length;}catch(e2){}
      return true;
    }
    async function xywsInstallOutfit(w){
      var d=(w&&w.outfit)||{},text=String(d.description||(w&&w.body)||'').trim();if(!text)return {ok:false,msg:'这个装束没有可写入的描述'};
      var M=xywsResolveMvu();if(!M)return {ok:false,msg:'没有找到 MVU 写入接口；请确认 MVU / 酒馆助手已正常加载'};
      var opt={type:'message',message_id:'latest'},oldData=null;try{oldData=M.getMvuData(opt);}catch(e){}
      if(!oldData||!oldData.stat_data)return {ok:false,msg:'当前楼层还没有可写入的 MVU 数据'};
      var next=xywsClone(oldData);if(!next||!next.stat_data)return {ok:false,msg:'复制当前 MVU 数据失败'};
      if(!next.stat_data.主角||typeof next.stat_data.主角!=='object')next.stat_data.主角={};
      if(!next.stat_data.主角.躯体||typeof next.stat_data.主角.躯体!=='object')next.stat_data.主角.躯体={};
      if(!next.stat_data.主角.躯体.变身外观||typeof next.stat_data.主角.躯体.变身外观!=='object')next.stat_data.主角.躯体.变身外观={白描:'',变身装甲:''};
      next.stat_data.主角.躯体.变身外观.变身装甲=text;
      try{await M.replaceMvuData(next,opt);}catch(ex){return {ok:false,msg:'MVU 写入失败：'+(ex&&ex.message?ex.message:'未知错误')};}
      return {ok:true,msg:'已写入 主角.躯体.变身外观.变身装甲'};
    }
    async function xywsInstallItem(w){
      var it=(w&&w.item)||{},name=String((w&&w.title)||'').trim(),qty=Math.round(Number(it.quantity)||1),cat=String(it.category||'杂物').trim()||'杂物',desc=String(it.description||'').trim();
      if(!name)return {ok:false,msg:'物品缺少名称'};if(qty<1)return {ok:false,msg:'物品数量必须大于 0'};if(!desc)return {ok:false,msg:'这个物品没有作用 / 描述'};
      var M=xywsResolveMvu();if(!M)return {ok:false,msg:'没有找到 MVU 写入接口；请确认 MVU / 酒馆助手已正常加载'};
      var opt={type:'message',message_id:'latest'},oldData=null;try{oldData=M.getMvuData(opt);}catch(e){}
      if(!oldData||!oldData.stat_data)return {ok:false,msg:'当前楼层还没有可写入的 MVU 数据'};
      var next=xywsClone(oldData);if(!next||!next.stat_data)return {ok:false,msg:'复制当前 MVU 数据失败'};
      if(!next.stat_data.主角||typeof next.stat_data.主角!=='object')next.stat_data.主角={};
      if(!next.stat_data.主角.背包||typeof next.stat_data.主角.背包!=='object'||Array.isArray(next.stat_data.主角.背包))next.stat_data.主角.背包={};
      var old=next.stat_data.主角.背包[name],oldQty=0,oldCat='',oldDesc='';
      if(typeof old==='number')oldQty=Math.round(old)||0;else if(old&&typeof old==='object'){oldQty=Math.round(Number(old.数量)||0);oldCat=String(old.类别||'').trim();oldDesc=String(old.描述||'').trim();}
      next.stat_data.主角.背包[name]={数量:Math.max(0,oldQty)+qty,类别:oldCat||cat,描述:oldDesc||desc};
      try{await M.replaceMvuData(next,opt);}catch(ex){return {ok:false,msg:'MVU 写入失败：'+(ex&&ex.message?ex.message:'未知错误')};}
      return {ok:true,msg:'已加入背包：'+name+' ×'+qty+(oldQty>0?'（现有数量已累加）':'')};
    }
    async function xywsInstallAbility(w){
      var a=(w&&w.ability)||{},slot=String(a.slot||''),school=String(a.school||'').trim(),stype=String(a.skillType||'').trim(),effect=String(a.effect||'').trim(),name=xywsAutoAbilityName(a),cost=Math.round(Number(a.mpCost));
      if(XYWS_SKILL_SLOTS.indexOf(slot)<0)return {ok:false,msg:'能力档位无效'};
      if(!school)return {ok:false,msg:'能力缺少系别 / 本能类别'};
      if(!effect)return {ok:false,msg:'能力缺少效果说明'};
      if(!Number.isFinite(cost))return {ok:false,msg:'能力蓝耗不是有效数字'};
      var rg=XYWS_SKILL_COST_RANGES[slot],M=xywsResolveMvu(),opt={type:'message',message_id:'latest'},oldData=null;
      if(!M)return {ok:false,msg:'没有找到 MVU 写入接口；请确认 MVU / 酒馆助手已正常加载'};try{oldData=M.getMvuData(opt);}catch(e){}
      if(!oldData||!oldData.stat_data)return {ok:false,msg:'当前楼层还没有可写入的 MVU 数据'};
      var cap=xywsSkillMaxSlot(oldData),want=XYWS_SKILL_SLOTS.indexOf(slot),max=XYWS_SKILL_SLOTS.indexOf(cap.max);
      if(want>max)return {ok:false,msg:'当前角色为'+cap.tier+'，最高只能安装'+cap.max+'；本次未改写变量'};
      if(!rg||cost<rg[0]||cost>rg[1])return {ok:false,msg:slot+'蓝耗应为 '+rg[0]+'～'+rg[1]+'；本次未改写变量'};
      var next=xywsClone(oldData);if(!next||!next.stat_data)return {ok:false,msg:'复制当前 MVU 数据失败'};
      if(!next.stat_data.主角||typeof next.stat_data.主角!=='object')next.stat_data.主角={};
      if(!next.stat_data.主角.招式||typeof next.stat_data.主角.招式!=='object'||Array.isArray(next.stat_data.主角.招式))next.stat_data.主角.招式={};
      if(Object.prototype.hasOwnProperty.call(next.stat_data.主角.招式,name))return {ok:false,msg:'当前招式表已经有同名「'+name+'」，为避免覆盖本次未写入'};
      next.stat_data.主角.招式[name]={档位:slot,系别:school,类型:stype,蓝耗:cost,效果:effect};
      try{await M.replaceMvuData(next,opt);}catch(ex){return {ok:false,msg:'MVU 写入失败：'+(ex&&ex.message?ex.message:'未知错误')};}
      return {ok:true,msg:'已写入招式变量：'+name};
    }

    function xywsInstallRule(w){
      var texts=xywsRuleTexts(w);if(!texts.length)return {ok:false,msg:'这个规则作品没有可安装的规则文本'};
      var scope=xywsScopeId(),a=xywsLoadRulesAll(),ids=[];
      texts.forEach(function(text,i){
        var id='xyws_rule_'+xywsHash(scope+'|'+String(w.id||w.title)+'|'+i),found=null;
        for(var k=0;k<a.length;k++)if(a[k]&&a[k].id===id){found=a[k];break;}
        if(found){found.text=text;found.on=true;found.xywsScope=scope;found.xywsWorkId=w.id;found.xywsTitle=w.title;}
        else a.push({id:id,text:text,on:true,xywsScope:scope,xywsWorkId:w.id,xywsTitle:w.title,xywsInstalledAt:Date.now()});
        ids.push(id);
      });
      xywsSaveRulesAll(a);
      return {ok:true,msg:'规则已作为本局工坊追加层持续生效（'+texts.length+' 条）'};
    }
    async function xywsInstallPlay(w){
      var text=String((w&&(w.body||w.desc))||'').trim();if(!text)return {ok:false,msg:'这个玩法没有可执行的自然语言内容'};
      var a=xywsPlayLoad();if(getLS(xywsPlayMigrationKey(),'0')==='1')a=xywsReconcilePlayFlags(a);var id='xyws_play_'+xywsHash(xywsScopeId()+'|'+String(w.id||w.title)),found=null;
      for(var i=0;i<a.length;i++)if(a[i]&&a[i].id===id){found=a[i];break;}
      if(found){found.title=w.title;found.text=text;found.on=true;found.workId=w.id;}
      else a.push({id:id,workId:w.id,title:w.title,text:text,on:true,installedAt:Date.now()});
      xywsPlaySaveLocal(a);
      var synced=await xywsSyncPlayToPacer();
      return synced?{ok:true,msg:'玩法已加入本局，并接入现有事件推进器 / 辅助主题系统持续执行'}:{ok:false,msg:'玩法已保存，但当前 MVU 推进器暂时不可写入'};
    }
    function xywsProfileUniqueName(a,name){
      var used={};(a||[]).forEach(function(p){if(p&&p.name)used[String(p.name)]=1;});if(!used[name])return name;var base=name+'（工坊）';if(!used[base])return base;var n=2;while(used[base+n])n++;return base+n;
    }
    function xywsInstallRole(w){
      var a=[];try{a=JSON.parse(getLS('star_pact_profiles_v1','[]'));if(!Array.isArray(a))a=[];}catch(e){a=[];}
      var src=(Array.isArray(w.source)&&w.source.length)?w.source:[],made=[];
      if(src.length){
        src.forEach(function(raw){
          if(!raw||typeof raw!=='object'||Array.isArray(raw))return;var p=xywsClone(raw)||{},nm=xywsProfileUniqueName(a,String(p.name||w.title||'工坊角色').trim()||'工坊角色');
          p.id='p_xyws_'+Date.now()+'_'+Math.floor(Math.random()*100000);p.name=nm;p.updated=Date.now();if(!p.state||typeof p.state!=='object')p.state={};if(!Array.isArray(p.roster))p.roster=[];a.unshift(p);made.push(nm);
        });
      }
      if(!made.length){
        var demon=/魔人|魔物|深渊/.test((w.tags||[]).join(' ')+' '+String(w.body||w.desc||'')),nm=xywsProfileUniqueName(a,String(w.title||'工坊角色').trim()||'工坊角色');
        var st={role:demon?'demon':'mahou',moral:'善良',page:'hub',routeTab:'normal',folds:[],look:String(w.body||w.desc||'')};
        if(demon){st.demon_name=nm;st.demon_trait=String(w.desc||'');}else{st.name=nm;st.trait=String(w.desc||'');}
        a.unshift({id:'p_xyws_'+Date.now()+'_'+Math.floor(Math.random()*100000),name:nm,updated:Date.now(),state:st,roster:[]});made.push(nm);
      }
      setLS('star_pact_profiles_v1',JSON.stringify(a));
      return {ok:true,msg:'已加入开场白命名档案库：'+made.join('、')+'；回到开场白即可调用'};
    }
    function xywsManagedItems(){
      var out=[],scope=xywsScopeId(),rules=xywsLoadRulesAll(),groups={};
      rules.forEach(function(r){
        if(!r||r.xywsScope!==scope||!r.xywsWorkId)return;
        var id=String(r.xywsWorkId),g=groups[id]||(groups[id]={type:'规则',id:id,title:r.xywsTitle||id,icon:'📜',rows:[]});g.rows.push(r);
      });
      Object.keys(groups).forEach(function(k){var g=groups[k];g.on=g.rows.every(function(r){return r.on!==false;});g.note=g.rows.length+' 条规则 · 每轮常驻';out.push(g);});
      var pc=xywsMountedPlayCounts();xywsPlayLoad().forEach(function(p){if(!p||!p.workId)return;out.push({type:'玩法',id:String(p.workId),title:p.title||p.workId,icon:'🎮',on:xywsPlayActualOn(p,pc),note:'文字玩法 · 已接入事件推进器持续挂载'});});
      return out;
    }
    async function xywsToggleManaged(type,id){
      if(type==='玩法'){
        var p=xywsPlayLoad();if(getLS(xywsPlayMigrationKey(),'0')==='1')p=xywsReconcilePlayFlags(p);var counts=xywsMountedPlayCounts(),target=null;for(var i=0;i<p.length;i++)if(p[i]&&String(p[i].workId)===String(id)){target=p[i];break;}if(!target)return null;
        var nextOn=!xywsPlayActualOn(target,counts),old=target.on;target.on=nextOn;xywsPlaySaveLocal(p);var ok=await xywsSyncPlayToPacer();if(!ok){target.on=old;xywsPlaySaveLocal(p);return null;}return nextOn;
      }
      if(type==='规则'){
        var scope=xywsScopeId(),a=xywsLoadRulesAll(),hits=a.filter(function(r){return r&&r.xywsScope===scope&&String(r.xywsWorkId)===String(id);}),allOn=hits.length&&hits.every(function(r){return r.on!==false;});
        a.forEach(function(r){if(r&&r.xywsScope===scope&&String(r.xywsWorkId)===String(id))r.on=!allOn;});xywsSaveRulesAll(a);return !allOn;
      }
      return null;
    }
    function xywsRemoveInstalledId(id){var a=arr(LS_INST),i=a.indexOf(id);if(i>=0){a.splice(i,1);setLS(LS_INST,JSON.stringify(a));}}
    async function xywsRemoveManaged(type,id){
      if(type==='玩法'){
        var old=xywsPlayLoad();if(getLS(xywsPlayMigrationKey(),'0')==='1')old=xywsReconcilePlayFlags(old);var next=old.filter(function(p){return !(p&&String(p.workId)===String(id));});xywsPlaySaveLocal(next);var ok=await xywsSyncPlayToPacer();if(!ok){xywsPlaySaveLocal(old);return false;}xywsRemoveInstalledId(id);return true;
      }
      if(type==='规则'){var scope=xywsScopeId(),a=xywsLoadRulesAll().filter(function(r){return !(r&&r.xywsScope===scope&&String(r.xywsWorkId)===String(id));});xywsSaveRulesAll(a);xywsRemoveInstalledId(id);return true;}
      return false;
    }
    async function installPerson(mode){
      if(!currentWork||currentWork.type!=='角色')return;var target=currentWork,r=mode==='opening'?xywsInstallNpcOpening(target):await xywsInstallNpc(target);if(r&&r.ok){rememberInstalled(target);xywsTrackCloudDownload(target);toast(r.msg||(mode==='opening'?'已加入开局重要人物名册':'已中途加入本局'));}else toast((r&&r.msg)||'人物加入失败');
    }
    async function installCurrent(){
      if(!currentWork)return;var r;if(currentWork.type==='开局')r=xywsInstallOpening(currentWork);else if(currentWork.type==='规则')r=xywsInstallRule(currentWork);else if(currentWork.type==='玩法')r=await xywsInstallPlay(currentWork);else if(currentWork.type==='装束')r=await xywsInstallOutfit(currentWork);else if(currentWork.type==='能力')r=await xywsInstallAbility(currentWork);else if(currentWork.type==='物品')r=await xywsInstallItem(currentWork);else if(currentWork.type==='NPC')r=xywsInstallSupport(currentWork);else if(currentWork.type==='角色'){await installPerson('now');return;}else{toast('这个作品类型暂未接入真实导入');return;}if(r&&r.ok){var installedWork=currentWork;rememberInstalled(installedWork);xywsTrackCloudDownload(installedWork);toast(r.msg||'已加入本局');if(installedWork.type==='规则'||installedWork.type==='玩法')openDetail(installedWork.id);}else toast((r&&r.msg)||'加入本局失败');
    }
    function renderFavs(){
      var ids=arr(LS_FAV), a=ids.map(byId).filter(Boolean);
      $('[data-favs]').innerHTML=a.length?'<div class="xyws-cards">'+a.map(function(w){return card(w);}).join('')+'</div>':'<div class="xyws-panel"><div class="xyws-muted">还没有收藏作品。</div></div>';
    }
    function xywsSafeName(v){
      return String(v==null?'':v).replace(/[\\/:*?"<>|\r\n]+/g,'_').replace(/^\s+|\s+$/g,'').slice(0,80)||'星海工坊作品';
    }
    function xywsWorkKind(w){
      if(!w)return 'unknown';
      if(w.type==='角色'||w.type==='NPC')return 'person';
      if(w.type==='开局')return 'opening';
      if(w.type==='规则')return 'rule';
      if(w.type==='玩法')return 'play';
      if(w.type==='装束')return 'outfit';
      if(w.type==='能力')return 'ability';
      if(w.type==='物品')return 'item';
      return 'unknown';
    }
    function xywsPersonSubtype(w){return w&&w.type==='NPC'?'support':'character';}
    function xywsCanonicalWork(w){
      var kind=xywsWorkKind(w),payload={};
      if(kind==='person')payload={source:xywsClone(Array.isArray(w.source)?w.source:[])||[],fallbackText:String(w.body||w.desc||'')};
      else if(kind==='opening')payload={text:xywsOpeningText(w)};
      else if(kind==='rule')payload={rules:xywsRuleTexts(w)};
      else if(kind==='play')payload={prompt:String(w.body||w.desc||'').trim()};
      else if(kind==='outfit'){var od=w.outfit||{};payload={description:String(od.description||w.body||'').trim()};}
      else if(kind==='ability'){var ab=w.ability||{};payload={skillName:String(ab.skillName||'').trim(),slot:String(ab.slot||''),school:String(ab.school||'').trim(),skillType:String(ab.skillType||'').trim(),mpCost:Number(ab.mpCost),effect:String(ab.effect||'').trim()};}
      else if(kind==='item'){var it=w.item||{};payload={category:String(it.category||'').trim(),quantity:Number(it.quantity)||1,description:String(it.description||'').trim()};}
      return {
        protocolVersion:XYWS_PACKAGE_VERSION,
        originId:String((w&&w.xywsOriginId)||w.id||''),
        contentType:kind,
        subtype:kind==='person'?xywsPersonSubtype(w):'',
        title:String(w.title||'未命名作品').slice(0,120),
        summary:String(xywsEnsureSummary(w)).slice(0,4000),
        tags:(Array.isArray(w.tags)?w.tags:[]).map(function(x){return String(x).slice(0,60);}).slice(0,24),
        payload:payload,
        createdAt:Number(w.created||w.createdAt)||0,
        author:{displayName:String(w.xywsAuthor||'').slice(0,80)}
      };
    }
    function xywsBuildPackage(works){
      return {schema:XYWS_PACKAGE_SCHEMA,version:XYWS_PACKAGE_VERSION,exportedAt:new Date().toISOString(),generator:'星海工坊 V2.0',works:(works||[]).map(xywsCanonicalWork)};
    }
    function xywsDownloadJson(obj,name){
      try{
        var blob=new win.Blob([JSON.stringify(obj,null,2)],{type:'application/json;charset=utf-8'}),url=win.URL.createObjectURL(blob),a=doc.createElement('a');
        a.href=url;a.download=xywsSafeName(name)+'.json';a.style.display='none';doc.body.appendChild(a);a.click();setTimeout(function(){try{win.URL.revokeObjectURL(url);}catch(e){}try{a.remove();}catch(e2){}},1200);return true;
      }catch(e){return false;}
    }
    function xywsExportWork(w){
      if(!w)return false;
      return xywsDownloadJson(xywsBuildPackage([w]),'星海工坊_'+w.title);
    }
    function xywsExportMine(){
      var mine=arr(LS_MINE);if(!mine.length)return false;
      return xywsDownloadJson(xywsBuildPackage(mine),'星海工坊_我的作品_'+new Date().toISOString().slice(0,10));
    }
    function xywsImportedId(cw,idx){
      return 'import_'+Date.now().toString(36)+'_'+idx+'_'+xywsHash(String(cw.originId||cw.title||idx)+'|'+Math.random());
    }
    function xywsFromCanonical(cw,idx){
      if(!cw||typeof cw!=='object')throw new Error('作品数据不是对象');if(Number(cw.protocolVersion||XYWS_PACKAGE_VERSION)!==XYWS_PACKAGE_VERSION)throw new Error('作品协议版本不支持');var kind=String(cw.contentType||''),p=(cw.payload&&typeof cw.payload==='object')?cw.payload:{},type='';
      if(kind==='person')type=(String(cw.subtype||'')==='support'?'NPC':'角色');else if(kind==='opening')type='开局';else if(kind==='rule')type='规则';else if(kind==='play')type='玩法';else if(kind==='outfit')type='装束';else if(kind==='ability')type='能力';else if(kind==='item')type='物品';else throw new Error('未知作品类型：'+kind);
      var w={id:xywsImportedId(cw,idx),xywsOriginId:String(cw.originId||''),xywsImported:true,xywsAuthor:String((cw.author&&cw.author.displayName)||''),type:type,icon:ICON[type]||'✦',title:String(cw.title||'未命名作品').slice(0,120),desc:String(cw.summary||'').slice(0,4000),tags:Array.isArray(cw.tags)?cw.tags.map(function(x){return String(x).slice(0,60);}).slice(0,24):[],likes:0,uses:0,created:Number(cw.createdAt)||Date.now()};
      if(kind==='person'){w.source=Array.isArray(p.source)?xywsClone(p.source):[];w.body=String(p.fallbackText||w.desc||'');if(type==='NPC'&&w.tags.indexOf('配角')<0)w.tags.push('配角');}
      else if(kind==='opening'){w.body=String(p.text||w.desc||'');w.source=w.body?[w.body]:[];}else if(kind==='rule'){var rr=Array.isArray(p.rules)?p.rules.map(function(x){return String(x).trim();}).filter(Boolean):[];w.source=rr.map(function(x,i){return {id:'import_rule_'+i,text:x,on:true};});w.body=rr.join('\n\n')||w.desc;}else if(kind==='play'){w.body=String(p.prompt||w.desc||'');}else if(kind==='outfit'){w.outfit={description:String(p.description||'')};w.body=w.outfit.description||w.desc;}else if(kind==='ability'){w.ability={skillName:String(p.skillName||''),slot:String(p.slot||''),school:String(p.school||''),skillType:String(p.skillType||''),mpCost:Number(p.mpCost),effect:String(p.effect||'')};w.body=xywsWorkBody(w);}else if(kind==='item'){w.item={category:String(p.category||''),quantity:Number(p.quantity)||1,description:String(p.description||'')};w.body=xywsWorkBody(w);}xywsEnsureSummary(w);return w;
    }
    function xywsParsePackage(raw){
      var pack=typeof raw==='string'?JSON.parse(raw):raw;
      if(!pack||typeof pack!=='object'||pack.schema!==XYWS_PACKAGE_SCHEMA)throw new Error('这不是星海工坊标准作品包');
      if(Number(pack.version)!==XYWS_PACKAGE_VERSION)throw new Error('作品包版本不支持：'+pack.version);
      if(!Array.isArray(pack.works)||!pack.works.length)throw new Error('作品包里没有作品');
      if(pack.works.length>XYWS_MAX_IMPORT_WORKS)throw new Error('单次最多导入 '+XYWS_MAX_IMPORT_WORKS+' 个作品');
      return pack.works.map(xywsFromCanonical);
    }
    function xywsSaveImported(incoming){
      var old=arr(LS_IMPORTED),origin={};
      old.forEach(function(w){if(w&&w.xywsOriginId)origin[String(w.xywsOriginId)+'|'+String(w.title||'')]=1;});
      var added=[];incoming.forEach(function(w){var k=String(w.xywsOriginId||'')+'|'+String(w.title||'');if(k!=='|'&&origin[k])return;origin[k]=1;old.unshift(w);added.push(w);});
      setLS(LS_IMPORTED,JSON.stringify(old));return {added:added,total:incoming.length};
    }
    function xywsImportText(raw){return xywsSaveImported(xywsParsePackage(raw));}
    function xywsWorldbookEntries(pack){
      if(!pack||typeof pack!=='object')return [];var src=pack.entries;if(!src||typeof src!=='object')return [];var rows=[];
      if(Array.isArray(src))rows=src.slice();else Object.keys(src).sort(function(a,b){var na=Number(a),nb=Number(b);return Number.isFinite(na)&&Number.isFinite(nb)?na-nb:String(a).localeCompare(String(b));}).forEach(function(k){var e=src[k];if(e&&typeof e==='object'){var c=xywsClone(e)||{};if(c.uid===undefined)c.uid=k;rows.push(c);}});
      return rows.filter(function(e){return e&&typeof e==='object'&&String(e.content||'').trim();}).slice(0,XYWS_MAX_IMPORT_WORKS);
    }
    function xywsWorldbookTitle(e,idx){
      var key=Array.isArray(e&&e.key)?e.key.filter(Boolean).join(' / '):String((e&&e.key)||'').trim();return String((e&&e.comment)||(e&&e.name)||key||('世界书条目 '+(idx+1))).trim().slice(0,120)||('世界书条目 '+(idx+1));
    }
    function xywsWorldbookWork(e,targetType,idx){
      // 世界书原文必须逐字保留。这里只用 trim() 判断是否为空，绝不把 trim() 后的结果写回正文。
      var content=String((e&&e.content)||''),title=xywsWorldbookTitle(e,idx),origin='stwb:'+xywsHash(String((e&&e.uid)||idx)+'|'+title+'|'+content),w={id:xywsImportedId({originId:origin,title:title},idx),xywsOriginId:origin,xywsImported:true,xywsImportFormat:'sillytavern.worldbook',xywsRawContent:content,xywsAuthor:'',type:targetType,icon:ICON[targetType]||'✦',title:title,desc:'',tags:['酒馆世界书'],likes:0,uses:0,created:Date.now(),body:content,source:[]};
      if(targetType==='角色'||targetType==='NPC'){
        var pk=targetType==='角色'?'mahou':'other',pr=xywsSanitizeNpcRecord({档案:{姓名:title,种族:targetType==='角色'?'魔法少女':'异种生命',身份:''},关系:{与主角关系:'',钩子:'',秘密:''}},pk);w.source=[xywsNpcSourceFromRecord(pr,pk,'',{freeform:content})];
      }
      else if(targetType==='开局')w.source=String(content).trim()?[content]:[];
      else if(targetType==='规则')w.source=[{id:'stwb_rule_'+idx,text:content,on:true,xywsPreserveRaw:true}];
      else if(targetType==='装束')w.outfit={description:content};
      else if(targetType==='能力'){w.ability={skillName:title,slot:'基础攻防',school:'未分类',skillType:'',mpCost:0,effect:content};}
      else if(targetType==='物品'){w.item={category:'世界书导入',quantity:1,description:content};}
      xywsEnsureSummary(w);return w;
    }
    function xywsRenderImportMap(){
      if(!xywsPendingImport)return;var rows=xywsPendingImport.entries||[],head=$('[data-import-head]'),note=$('[data-import-note]'),box=$('[data-import-items]');if(head)head.textContent=(xywsPendingImport.fileName||'世界书')+' · '+rows.length+' 条';if(note)note.textContent='每条会保留原 content 文本；comment / key 只用于生成标题。结构化栏目（能力、物品、人物、生灵）导入后仍可在“我的 → 上传云端”里继续检查和修改。';if(box)box.innerHTML=rows.map(function(e,i){return '<label class="xyws-check"><input type="checkbox" data-import-entry="'+i+'" checked><span><b>'+esc(xywsWorldbookTitle(e,i))+'</b><br>'+esc(xywsExcerpt(e.content,150))+'</span></label>';}).join('');
    }
    function xywsConfirmWorldbookImport(){
      if(!xywsPendingImport)return;var target=String(($('[data-import-target]')||{}).value||'玩法'),rows=xywsPendingImport.entries||[],picked=[];$$('[data-import-entry]').forEach(function(x){if(x.checked)picked.push(Number(x.getAttribute('data-import-entry')));});if(!picked.length){toast('请至少选择一条世界书内容');return;}var incoming=picked.map(function(i){return xywsWorldbookWork(rows[i],target,i);}),r=xywsSaveImported(incoming);xywsPendingImport=null;toast(r.added.length?('已导入 '+r.added.length+' 个作品到“'+target+'”'):('作品已存在，没有重复导入'));renderMine();show('mine');
    }
    function xywsReadImportFile(file){
      if(!file)return;
      if(file.size>2*1024*1024){toast('作品包过大：当前单文件限制 2MB');return;}
      var rd=new win.FileReader();rd.onload=function(){try{var raw=String(rd.result||''),obj=JSON.parse(raw);if(obj&&obj.schema===XYWS_PACKAGE_SCHEMA){var r=xywsImportText(obj);toast(r.added.length?('已导入 '+r.added.length+' 个作品'):('作品已存在，没有重复导入'));renderMine();show('mine');return;}var wb=xywsWorldbookEntries(obj);if(wb.length){xywsPendingImport={fileName:String(file.name||'酒馆世界书.json'),entries:wb};xywsRenderImportMap();show('importmap');return;}throw new Error('既不是星海工坊作品包，也没有识别到 SillyTavern 世界书 entries');}catch(e){toast('导入失败：'+(e&&e.message?e.message:'格式错误'));}};rd.onerror=function(){toast('读取作品包失败');};rd.readAsText(file,'utf-8');
    }

    function renderMine(){
      var A=xywsAuthApi(), prof=(A&&typeof A.getDiscordProfile==='function')?A.getDiscordProfile():null, h='';
      var name=prof?(String(prof.global_name||prof.username||'').trim()||'未知玩家'):'未知玩家';
      var av='';
      if(prof&&prof.id&&prof.avatar){
        av='<img class="xyws-avatar" src="https://cdn.discordapp.com/avatars/'+encodeURIComponent(prof.id)+'/'+encodeURIComponent(prof.avatar)+'.png?size=128" alt="">';
      }else{
        av='<div class="xyws-avatar xyws-avatar-fallback">'+esc(String(name).slice(0,1).toUpperCase()||'✦')+'</div>';
      }
      h+='<div class="xyws-panel"><h4>账号</h4><div class="xyws-account">'+av+'<div class="xyws-account-copy"><b>'+esc(name)+'</b>'+(prof&&prof.username?('<span>@'+esc(prof.username)+'</span>'):'')+'<span>已登录 · Discord</span>'+(xywsProbeOk?'<span>CloudBase 身份 · 已验证</span>':'')+'</div><div class="xyws-account-btns"><button class="xyws-secondary" data-a="auth-probe">验证云端身份</button><button class="xyws-secondary" data-a="auth-logout">退出登录</button></div></div></div>';
      var installed=arr(LS_INST).map(byId).filter(function(w){return w&&w.type!=='规则'&&w.type!=='玩法';}),localMine=arr(LS_MINE),mine=xywsMergedMine(),imported=arr(LS_IMPORTED);
      h+='<div class="xyws-panel"><h4>一次性导入记录 · '+installed.length+'</h4><div class="xyws-muted">'+(installed.length?installed.map(function(w){return (w.icon||ICON[w.type]||'✦')+' '+esc(w.title);}).join('<br>'):'暂无；人物/生灵、装束、能力、物品属于一次性安装，开局作品会写入聊天框。')+'</div></div>';
      h+='<div class="xyws-panel"><h4>导入 / 导出 · XYWS Package v1</h4><div class="xyws-muted">支持星海工坊标准作品包，也能识别 SillyTavern 世界书 entries。世界书导入时会先让你选择目标栏目，不再默认塞进“玩法”。</div><div class="xyws-actions" style="margin-top:10px"><button class="xyws-secondary" data-a="import-pack">⇧ 导入 JSON</button><button class="xyws-secondary" data-a="export-mine" '+(localMine.length?'':'disabled')+'>⇩ 导出我的全部作品</button></div></div>';
      h+='<div class="xyws-panel"><h4>长期内容管理</h4><div class="xyws-muted">规则与玩法已移到首页分类栏的“已启用”页集中整理，避免和作品库混在一起。</div></div>';
      h+='<div class="xyws-panel"><h4>我的作品 · '+mine.length+'</h4><div class="xyws-muted">'+(xywsManageLoaded?'已按服务器 ownership 同步当前账号的云端作品；自己的云端作品可直接编辑，本机草稿可直接上传。':'正在同步服务器 ownership；同步完成后会显示自己云端作品的编辑 / 删除入口。')+'</div></div>';
      if(mine.length)h+='<div class="xyws-cards">'+mine.map(function(w){var localOnly=!w.xywsCloud&&String(w.id||'').indexOf('mine_')===0;return card(w,null,{canDelete:xywsCanDeleteCloud(w),canEdit:xywsCanEditCloud(w),canUpload:localOnly});}).join('')+'</div>';
      if(!xywsManageLoaded&&!xywsManageLoading)setTimeout(function(){xywsSyncManage(false);},0);
      h+='<div class="xyws-panel"><h4>本地导入作品 · '+imported.length+'</h4><div class="xyws-muted">'+(imported.length?'这些作品可能来自星海工坊作品包或 SillyTavern 世界书。可先查看 / 安装，也可点“上传云端”，发布前还能重新选择栏目并修改名称、简介与内容。':'还没有导入外部 JSON。')+'</div></div>';
      if(imported.length)h+='<div class="xyws-cards">'+imported.map(function(w){return card(w,null,{canUpload:true});}).join('')+'</div>';
      $('[data-mine]').innerHTML=h;
    }


    function parseProfiles(){try{var a=JSON.parse(getLS('star_pact_profiles_v1','[]'));return Array.isArray(a)?a:[];}catch(e){return[];}}
    function parseCurrent(){try{return JSON.parse(getLS('star_pact_cur_v5','{}'))||{};}catch(e){return{};}}
    function parseRoster(){try{var a=JSON.parse(getLS('star_pact_cur_v5_roster','[]'));return Array.isArray(a)?a:[];}catch(e){return[];}}
    function parseRules(){try{var a=JSON.parse(getLS('xysb_world_rules','[]')),scope=xywsScopeId();return Array.isArray(a)?a.filter(function(r){return r&&(!r.xywsScope||r.xywsScope===scope);}):[];}catch(e){return[];}}

    function pubSource(type){
      if(type==='角色')return parseProfiles().map(function(p){return {id:p.id||p.name,label:p.name||'未命名档案',value:p};});
      if(type==='开局'){var s=parseCurrent(),r=String(s.route||'').trim();return r?[{id:'current_route',label:r.slice(0,40),value:r}]:[];}
      if(type==='规则')return parseRules().filter(function(r){return r&&String(r.text||'').trim();}).map(function(r,i){return {id:r.id||String(i),label:String(r.text).slice(0,45),value:r};});return [];
    }
    function updatePickLabel(){
      var btn=$('[data-pickbtn]'); if(!btn)return;
      var n=(overlay.__xywsPickedIds||[]).length;
      btn.textContent = n ? ('已选择 '+n+' 项') : '选择发布内容';
    }
    function renderPick(){
      $('[data-picktitle]').textContent = pubType==='角色'?'选择已有重要人物':(pubType==='规则'?'选择规则':'选择内容');
      var multi = pubType==='规则';
      $('[data-pickhint]').textContent = multi ? '可多选，选好后点“确定”。' : '单选，选好后点“确定”。';
      var items=overlay.__xywsSources||[], pickedIds=(overlay.__xywsPickedIds||[]).map(String);
      var box=$('[data-pickitems]');
      if(!items.length){
        box.innerHTML='<div class="xyws-panel"><div class="xyws-muted">暂无可用内容。先在卡里创建 / 保存后再回来。</div></div>';
      } else {
        box.innerHTML='<div class="xyws-checklist">'+items.map(function(s,i){
          var on=pickedIds.indexOf(String(s.id))>=0;
          return '<label class="xyws-check"><input type="'+(multi?'checkbox':'radio')+'" name="xyws-pick" data-pick="'+i+'" '+(on?'checked':'')+'><span>'+esc(s.label)+'</span></label>';
        }).join('')+'</div>';
      }
    }
    function confirmPick(){
      var items=overlay.__xywsSources||[], picked=[];
      $$('[data-pick]').forEach(function(x){
        if(x.checked){
          var idx=Number(x.getAttribute('data-pick'));
          var s=items[idx];
          if(s && picked.indexOf(String(s.id))<0) picked.push(String(s.id));
        }
      });
      overlay.__xywsPickedIds=picked;
      if(picked.length){
        var chosen=items.filter(function(x){return String(x.id)===picked[0];})[0];
        if(pubType==='角色'&&chosen)xywsPopulateNpcPublish(chosen.value,pubType);
        if(pubType==='规则'){
          var chosenRules=items.filter(function(x){return picked.indexOf(String(x.id))>=0;}).map(function(x){var v=x.value;return (v&&typeof v==='object')?String(v.text||'').trim():String(v||'').trim();}).filter(Boolean);
          var ruleBox=$('[data-pubdesc]');if(ruleBox)ruleBox.value=chosenRules.join('\n\n');
        }
      }
      updatePickLabel();
      show('publish');
    }
    function xywsRefreshCloud(force){
      var C=(typeof window!=='undefined'&&window.__XYWS_CLOUD__)?window.__XYWS_CLOUD__:null;
      try{if(!C&&typeof globalThis!=='undefined')C=globalThis.__XYWS_CLOUD__;}catch(e){}
      if(!C||typeof C.fetchWorks!=='function')return Promise.resolve(null);
      return C.fetchWorks(force).then(function(works){
        if(Array.isArray(works)){ WORKS=works; }
        else {
          WORKS=DEMO_WORKS.slice();
          if(!xywsCloudWarned){ xywsCloudWarned=true; try{toast('云端作品库暂时不可用，已使用本地演示数据');}catch(e){} }
        }
        if(overlay && overlay.classList.contains('on') && currentScreen==='home'){ try{renderHome();}catch(e){} }
        return works;
      }).catch(function(){
        WORKS=DEMO_WORKS.slice();
        if(!xywsCloudWarned){ xywsCloudWarned=true; try{toast('云端作品库暂时不可用，已使用本地演示数据');}catch(e){} }
        return null;
      });
    }
    function xywsNpcRowEsc(v){return esc(String(v==null?'':v));}
    function xywsNpcSkillRow(a,name){a=xywsNpcObj(a);return '<div class="xyws-npcrow" data-npc-skill-row><input data-f="name" placeholder="招式名称" value="'+xywsNpcRowEsc(name||'')+'"><select data-f="slot"><option>基础攻防</option><option>小技能</option><option>中技能</option><option>大技能</option><option>领域</option><option>规则级</option></select><input data-f="school" placeholder="系别" value="'+xywsNpcRowEsc(a.系别||'')+'"><input data-f="type" placeholder="类型" value="'+xywsNpcRowEsc(a.类型||'')+'"><input data-f="cost" inputmode="numeric" placeholder="蓝耗" value="'+xywsNpcRowEsc(a.蓝耗==null?'':a.蓝耗)+'"><textarea data-f="effect" placeholder="效果 / 限制">'+xywsNpcRowEsc(a.效果||'')+'</textarea><button type="button" class="xyws-npcdel" data-a="npc-del-row">删</button></div>';}
    function xywsNpcGearRow(a,name){a=xywsNpcObj(a);return '<div class="xyws-npcrow xyws-npcrow-gear" data-npc-gear-row><input data-f="name" placeholder="星器 / 装备名称" value="'+xywsNpcRowEsc(name||'')+'"><input data-f="type" placeholder="类型" value="'+xywsNpcRowEsc(a.类型||'')+'"><select data-f="grade"><option>寻常</option><option>精良</option><option>星辉</option><option>传说</option></select><select data-f="bond"><option>初缔</option><option>相合</option><option>心意相通</option><option>星灵共鸣</option></select><textarea data-f="effect" placeholder="效果 / 特征">'+xywsNpcRowEsc(a.效果||'')+'</textarea><button type="button" class="xyws-npcdel" data-a="npc-del-row">删</button></div>';}
    function xywsNpcItemRow(a,name){a=xywsNpcObj(a);return '<div class="xyws-npcrow xyws-npcrow-item" data-npc-item-row><input data-f="name" placeholder="物品名称" value="'+xywsNpcRowEsc(name||'')+'"><input data-f="qty" inputmode="numeric" placeholder="数量" value="'+xywsNpcRowEsc(a.数量==null?'':a.数量)+'"><input data-f="cat" placeholder="类别" value="'+xywsNpcRowEsc(a.类别||'')+'"><textarea data-f="desc" placeholder="作用 / 描述">'+xywsNpcRowEsc(a.描述||'')+'</textarea><button type="button" class="xyws-npcdel" data-a="npc-del-row">删</button></div>';}
    function xywsNpcInjuryRow(desc,name){return '<div class="xyws-npcrow xyws-npcrow-injury" data-npc-injury-row><input data-f="name" placeholder="伤势名称 / 部位" value="'+xywsNpcRowEsc(name||'')+'"><textarea data-f="desc" placeholder="伤势描述 / 影响">'+xywsNpcRowEsc(desc||'')+'</textarea><button type="button" class="xyws-npcdel" data-a="npc-del-row">删</button></div>';}
    function xywsNpcBodyRow(a,name){a=xywsNpcObj(a);return '<div class="xyws-npcrow xyws-npcrow-body" data-npc-body-row><input data-f="name" placeholder="部位 / 形态名称，如 整体、头部、双翼" value="'+xywsNpcRowEsc(name||'')+'"><textarea data-f="plain" placeholder="白描：日常 / 本体外观">'+xywsNpcRowEsc(a.白描||'')+'</textarea><textarea data-f="armor" placeholder="变身装甲：变身 / 显形后的装束与覆盖">'+xywsNpcRowEsc(a.变身装甲||'')+'</textarea><button type="button" class="xyws-npcdel" data-a="npc-del-row">删</button></div>';}
    function xywsNpcSetSelect(row,f,val){var el=row&&row.querySelector('[data-f="'+f+'"]');if(el&&val)el.value=String(val);}
    function xywsNpcAppendSkill(a,name){var box=$('[data-npc-skill-list]');if(!box)return;var wrap=doc.createElement('div');wrap.innerHTML=xywsNpcSkillRow(a,name);var row=wrap.firstElementChild;box.appendChild(row);xywsNpcSetSelect(row,'slot',a&&a.档位);}
    function xywsNpcAppendGear(a,name){var box=$('[data-npc-gear-list]');if(!box)return;var wrap=doc.createElement('div');wrap.innerHTML=xywsNpcGearRow(a,name);var row=wrap.firstElementChild;box.appendChild(row);xywsNpcSetSelect(row,'grade',a&&a.品阶);xywsNpcSetSelect(row,'bond',a&&a.契合);}
    function xywsNpcAppendItem(a,name){var box=$('[data-npc-item-list]');if(!box)return;var wrap=doc.createElement('div');wrap.innerHTML=xywsNpcItemRow(a,name);box.appendChild(wrap.firstElementChild);}
    function xywsNpcAppendInjury(desc,name){var box=$('[data-npc-injury-list]');if(!box)return;var wrap=doc.createElement('div');wrap.innerHTML=xywsNpcInjuryRow(desc,name);box.appendChild(wrap.firstElementChild);}
    function xywsNpcAppendBody(a,name){var box=$('[data-npc-body-list]');if(!box)return;var wrap=doc.createElement('div');wrap.innerHTML=xywsNpcBodyRow(a,name);box.appendChild(wrap.firstElementChild);}
    function xywsNpcField(name){var e=$('[data-npc="'+name+'"]');return e?String(e.value||'').trim():'';}
    function xywsNpcSetField(name,v){var e=$('[data-npc="'+name+'"]');if(e)e.value=(v==null?'':v);}
    function xywsNpcReadPublish(){
      var kind=xywsNpcField('kind')||'mahou',name=xywsNpcField('name');if(!name)return {ok:false,msg:'请填写人物姓名'};
      var legacy=overlay&&overlay.__xywsNpcLegacySource?xywsClone(overlay.__xywsNpcLegacySource):null,base=legacy&&legacy.npc?legacy.npc:{},oldKind=legacy&&legacy.kind; if(oldKind&&oldKind!==kind)base={};
      var rec=xywsSanitizeNpcRecord(base,kind),d=rec.档案,w=rec.战力,st=rec.状态,co=rec.侵蚀,r=rec.关系,age=xywsNpcNum(xywsNpcField('age'),0),levelRaw=xywsNpcField('level');
      d.姓名=name;d.代号=xywsNpcField('alias');d.性别=xywsNpcField('gender');d.种族=xywsNpcField('race')||xywsNpcRaceForKind(kind);d.真实年龄=age;d.表观年龄=age;d.身份=xywsNpcField('identity');d.阵营=xywsNpcField('camp');d.能力系别=xywsNpcField('school');d.外貌=xywsNpcField('look');
      if(levelRaw){var lv=Number(levelRaw);if(!Number.isFinite(lv)||Math.round(lv)!==lv||lv<1||lv>70)return {ok:false,msg:'等级请填写 1～70 的整数；不知道就留空'};w.等级=lv;w.层级声明='';}else if(!legacy){w.等级=0;w.层级声明='';}
      st.战服=xywsNpcField('battlewear');st.处境=xywsNpcField('situation');st.位置=xywsNpcField('location');co.阶段=xywsNpcField('corruption')||'未染';r.与主角关系=xywsNpcField('relation');r.钩子=xywsNpcField('hook');r.秘密=xywsNpcField('secret');
      rec=xywsSanitizeNpcRecord(rec,kind);var notes=xywsNpcNotes({personality:xywsNpcField('personality'),background:xywsNpcField('background'),combatStyle:xywsNpcField('combatStyle'),freeform:xywsNpcField('freeform')});var source=xywsNpcSourceFromRecord(rec,kind,xywsNpcField('debut'),notes);return {ok:true,source:source,data:{},body:xywsNpcRecordText(rec,notes)};
    }
    function xywsPopulateNpcPublish(raw,workType){
      var src=xywsNormalizeNpcSource(raw,{type:'角色',title:(raw&&raw.name)||''}),rec=src.npc,d=rec.档案,w=rec.战力,st=rec.状态,co=rec.侵蚀,r=rec.关系,notes=xywsNpcNotes(src.notes);overlay.__xywsNpcLegacySource=xywsClone(src);
      xywsNpcSetField('kind',src.kind);xywsNpcSetField('name',d.姓名);xywsNpcSetField('identity',d.身份);xywsNpcSetField('relation',r.与主角关系);xywsNpcSetField('school',d.能力系别);xywsNpcSetField('battlewear',st.战服);xywsNpcSetField('combatStyle',notes.combatStyle);xywsNpcSetField('look',d.外貌);xywsNpcSetField('personality',notes.personality);xywsNpcSetField('alias',d.代号);xywsNpcSetField('gender',d.性别);xywsNpcSetField('race',d.种族);xywsNpcSetField('age',d.真实年龄||d.表观年龄||'');xywsNpcSetField('camp',d.阵营);xywsNpcSetField('level',w.等级||'');xywsNpcSetField('location',st.位置);xywsNpcSetField('corruption',co.阶段||'未染');xywsNpcSetField('debut',src.debut||'');xywsNpcSetField('situation',st.处境);xywsNpcSetField('background',notes.background);xywsNpcSetField('hook',r.钩子);xywsNpcSetField('secret',r.秘密);xywsNpcSetField('freeform',notes.freeform);
    }
    function xywsNpcPublishHtml(){return '<div class="xyws-source"><b>人物 = 长期重要人物。</b> 魔法少女、魔人和关键凡人放这里；星灵、魔物、使魔、灵兽、路人请发到“生灵 / 配角”。除姓名外都可留空，输入框会直接对应现有合法字段，不让 AI 猜分类。</div><div class="xyws-field"><label>人物类型</label><select data-npc="kind"><option value="mahou">魔法少女 / 守护者</option><option value="demon">魔人</option><option value="mortal">关键凡人</option><option value="other">其他重要人物</option></select></div><details class="xyws-npcsec" open><summary>常用信息</summary><div class="xyws-pubgrid"><div class="xyws-field"><label>姓名</label><input data-npc="name"></div><div class="xyws-field"><label>身份 / 职业</label><input data-npc="identity" placeholder="学生、研究员、游荡魔人……"></div><div class="xyws-field"><label>与主角关系</label><input data-npc="relation" placeholder="队友、对手、同学……"></div><div class="xyws-field"><label>等级（1～70，选填）</label><input data-npc="level" inputmode="numeric" placeholder="不知道就留空"></div><div class="xyws-field"><label>能力系别 / 本能</label><input data-npc="school" placeholder="感知系、空间系、蚀心·精神……"></div><div class="xyws-field"><label>当前装束 / 武装</label><input data-npc="battlewear"></div></div><div class="xyws-source">等级会由现有星辉内核自动换算阶级 / 位格，不用自己配。Lv1–10＝见习 / 孳生体；11–25＝正式 / 蚀魂者；26–40＝精英 / 化渊者；41–55＝战姬 / 噬星者；56–70＝传奇 / 渊厄。关键凡人不知道等级可以直接留空。</div><div class="xyws-field"><label>外貌</label><textarea data-npc="look" placeholder="一两句整体特征即可"></textarea></div><div class="xyws-field"><label>性格 / 行为</label><textarea data-npc="personality" placeholder="叙事硬设定；不会创建假变量"></textarea></div></details><details class="xyws-npcsec"><summary>更多选填</summary><div class="xyws-pubgrid"><div class="xyws-field"><label>代号 / 称号</label><input data-npc="alias"></div><div class="xyws-field"><label>性别</label><input data-npc="gender"></div><div class="xyws-field"><label>种族</label><input data-npc="race"></div><div class="xyws-field"><label>年龄</label><input data-npc="age" inputmode="numeric" placeholder="数字；会同时用于真实/表观年龄"></div><div class="xyws-field"><label>阵营</label><input data-npc="camp"></div><div class="xyws-field"><label>当前位置</label><input data-npc="location"></div><div class="xyws-field"><label>侵蚀阶段</label><select data-npc="corruption"><option value="未染">未染</option><option>初蚀</option><option>沉沦</option><option>半堕</option><option>恶堕</option></select></div><div class="xyws-field"><label>登场安排</label><input data-npc="debut" placeholder="仅登记 / 自然安排 / 尽快登场"></div></div><div class="xyws-field"><label>当前处境</label><textarea data-npc="situation"></textarea></div><div class="xyws-field"><label>战斗方式 / 行动偏好</label><textarea data-npc="combatStyle"></textarea></div><div class="xyws-field"><label>背景 / 经历</label><textarea data-npc="background" placeholder="叙事硬设定，不新增变量路径"></textarea></div><div class="xyws-field"><label>剧情钩子（只有真正伏笔才填）</label><textarea data-npc="hook"></textarea></div><div class="xyws-field"><label>秘密（只有确实隐瞒的事实才填）</label><textarea data-npc="secret"></textarea></div><div class="xyws-field"><label>其他补充</label><textarea data-npc="freeform" placeholder="只作为叙事补充，不让 AI 自动猜变量"></textarea></div></details>';}

    function xywsSupportField(name){var e=$('[data-support="'+name+'"]');return e?String(e.value||'').trim():'';}
    function xywsSupportSetField(name,v){var e=$('[data-support="'+name+'"]');if(e)e.value=v==null?'':String(v);}
    function xywsSupportPublishHtml(){return '<div class="xyws-source"><b>生灵 / 配角 = 轻量设定。</b> 适合星灵、魔物、使魔、灵兽、路人和一次性配角。它不会写入 <b>/重要人物</b>，也不会进入 NPC 控制台；通常填名称 + 一两项特征就够了。</div><div class="xyws-pubgrid"><div class="xyws-field"><label>类型</label><select data-support="kind"><option value="spirit">星灵</option><option value="monster">魔物</option><option value="familiar">使魔</option><option value="beast">灵兽 / 异种生物</option><option value="mortal">普通人 / 路人</option><option value="other">其他配角</option></select></div><div class="xyws-field"><label>名称</label><input data-support="name"></div></div><div class="xyws-field"><label>一句话定位 / 身份（选填）</label><input data-support="role" placeholder="例如：会说话的银羽星灵 / 废墟里的巡游魔物"></div><div class="xyws-pubgrid"><div class="xyws-field"><label>外貌（选填）</label><textarea data-support="appearance"></textarea></div><div class="xyws-field"><label>性格 / 行为（选填）</label><textarea data-support="personality"></textarea></div><div class="xyws-field"><label>能力 / 危险点（选填）</label><textarea data-support="ability"></textarea></div><div class="xyws-field"><label>与主角关系 / 剧情用途（选填）</label><textarea data-support="relation"></textarea></div></div><details class="xyws-npcsec"><summary>更多选填</summary><div class="xyws-field"><label>登场方式</label><input data-support="debut"></div><div class="xyws-field"><label>补充设定</label><textarea data-support="notes"></textarea></div></details>';}
    function xywsSupportReadPublish(){var name=xywsSupportField('name');if(!name)return {ok:false,msg:'请填写生灵 / 配角名称'};var src={kind:xywsSupportField('kind')||'other',name:name,role:xywsSupportField('role'),appearance:xywsSupportField('appearance'),personality:xywsSupportField('personality'),ability:xywsSupportField('ability'),relation:xywsSupportField('relation'),debut:xywsSupportField('debut'),notes:xywsSupportField('notes'),include:true};return {ok:true,source:src,data:{},body:xywsSupportText(src)};}
    function xywsPopulateSupportPublish(raw,w){var p=xywsNormalizeSupportSource(raw,w||{type:'NPC'});['kind','name','role','appearance','personality','ability','relation','debut','notes'].forEach(function(k){xywsSupportSetField(k,p[k]);});}
    function xywsAutoAbilityName(a){
      a=a||{};var manual=String(a.skillName||'').trim();if(manual)return manual.slice(0,60);
      var school=String(a.school||'').trim().replace(/系$/,'');if(school==='未分类')school='';var stype=String(a.skillType||'').trim();
      if(school&&stype)return (school+'·'+stype).slice(0,60);if(stype)return (stype+'式').slice(0,60);if(school)return (school+'术式').slice(0,60);
      var lead=String(a.effect||'').replace(/\s+/g,' ').split(/[。！？；;，,]/)[0].trim().slice(0,12);return lead?('能力·'+lead):'未命名能力';
    }
    function xywsRenderPublishExtra(type){
      var box=$('[data-pubextra]');if(!box)return;box.innerHTML='';
      if(type==='角色'){box.innerHTML=xywsNpcPublishHtml();return;}if(type==='NPC'){box.innerHTML=xywsSupportPublishHtml();return;}
      if(type==='装束'){box.innerHTML='<div class="xyws-field"><label>整体装束描述</label><textarea data-outfit-desc placeholder="先写整体观感、关键特征和武装；通常这一栏就够了。"></textarea></div><details class="xyws-npcsec"><summary>更多选填</summary><div class="xyws-pubgrid"><div class="xyws-field"><label>主题 / 风格</label><input data-outfit="theme"></div><div class="xyws-field"><label>主色 / 材质</label><input data-outfit="palette"></div><div class="xyws-field"><label>关键部件 / 饰品</label><textarea data-outfit="parts"></textarea></div><div class="xyws-field"><label>武装 / 光效 / 动态 / 受损表现</label><textarea data-outfit="effects"></textarea></div></div></details>';return;}
      if(type==='能力'){box.innerHTML='<div class="xyws-pubgrid"><div class="xyws-field"><label>招式名称（选填）</label><input data-ability-name placeholder="留空时，发布途中会自动命名，不调用 AI"></div><div class="xyws-field"><label>档位</label><select data-ability-slot>'+XYWS_SKILL_SLOTS.map(function(x){return '<option>'+x+'</option>';}).join('')+'</select></div><div class="xyws-field"><label>系别 / 本能类别</label><input data-ability-school placeholder="空间系、特殊系·空间、蚀心·精神……都可以"></div><div class="xyws-field"><label>类型（选填 · 自由填写）</label><input data-ability-type placeholder="攻击、反击、位移、结界展开……按实际作用写"></div><div class="xyws-field"><label>蓝耗</label><input data-ability-cost type="number" inputmode="numeric" value="0"></div></div><div class="xyws-source">蓝耗按现有系统档位校验：基础 0–8｜小 20–50｜中 110–180｜大 360–520｜领域 1000–1500｜规则级 2800–4200。类型不是固定分类，可自由填写。</div><div class="xyws-field"><label>效果 / 能力说明</label><textarea data-ability-effect placeholder="写清能力如何发动、实际效果、限制或边界。"></textarea></div>';return;}
      if(type==='物品'){box.innerHTML='<div class="xyws-field"><label>作用 / 描述</label><textarea data-item-desc placeholder="写清它是什么、能做什么即可"></textarea></div><details class="xyws-npcsec"><summary>更多选填</summary><div class="xyws-pubgrid"><div class="xyws-field"><label>类别</label><input data-item-category value="杂物"></div><div class="xyws-field"><label>数量</label><input data-item-qty inputmode="numeric" value="1"></div></div></details>';return;}
    }
    function xywsExtraField(sel){var e=$(sel);return e?String(e.value||'').trim():'';}
    function xywsReadPublishExtra(type){
      if(type==='角色')return xywsNpcReadPublish();if(type==='NPC')return xywsSupportReadPublish();
      if(type==='装束'){var d=xywsComposeDetails([['主题 / 风格',xywsExtraField('[data-outfit="theme"]')],['主色 / 材质',xywsExtraField('[data-outfit="palette"]')],['关键部件 / 饰品',xywsExtraField('[data-outfit="parts"]')],['武装 / 光效 / 动态 / 受损表现',xywsExtraField('[data-outfit="effects"]')]],xywsExtraField('[data-outfit-desc]'));return d?{ok:true,data:{outfit:{description:d}},body:d}:{ok:false,msg:'请填写装束描述'};}
      if(type==='能力'){var name=xywsExtraField('[data-ability-name]'),slot=xywsExtraField('[data-ability-slot]')||'基础攻防',school=xywsExtraField('[data-ability-school]'),stype=xywsExtraField('[data-ability-type]'),baseEffect=xywsExtraField('[data-ability-effect]'),raw=xywsExtraField('[data-ability-cost]'),cost=Number(raw),rg=XYWS_SKILL_COST_RANGES[slot];if(XYWS_SKILL_SLOTS.indexOf(slot)<0)return {ok:false,msg:'请选择有效的能力档位'};if(!school)return {ok:false,msg:'请填写系别 / 本能类别'};if(raw===''||!Number.isFinite(cost)||Math.round(cost)!==cost)return {ok:false,msg:'请填写整数蓝耗'};if(!rg||cost<rg[0]||cost>rg[1])return {ok:false,msg:slot+'蓝耗应为 '+rg[0]+'～'+rg[1]};if(!baseEffect)return {ok:false,msg:'请填写效果 / 能力说明'};var a={skillName:name,slot:slot,school:school,skillType:stype,mpCost:cost,effect:baseEffect};a.skillName=xywsAutoAbilityName(a);var tmp={type:'能力',ability:a};return {ok:true,data:{ability:a},body:xywsWorkBody(tmp)};}
      if(type==='物品'){var cat=xywsExtraField('[data-item-category]')||'杂物',rawq=xywsExtraField('[data-item-qty]')||'1',qty=Number(rawq),baseDesc=xywsExtraField('[data-item-desc]');if(!Number.isFinite(qty)||Math.round(qty)!==qty||qty<1)return {ok:false,msg:'物品数量必须是大于 0 的整数'};if(!baseDesc)return {ok:false,msg:'请填写物品的作用 / 描述'};var it={category:cat,quantity:qty,description:baseDesc},tmp2={type:'物品',item:it};return {ok:true,data:{item:it},body:xywsWorkBody(tmp2)};}return {ok:true,data:{},body:''};
    }
    function xywsExcerpt(v,n){var s=String(v||'').replace(/\s+/g,' ').trim();return s.length>(n||120)?s.slice(0,(n||120)-1)+'…':s;}
    function xywsPublishTitle(type,picked,ex){
      var typed=String(($('[data-pubname]')||{}).value||'').trim();if(type==='角色')return String(ex.source&&ex.source.npc&&ex.source.npc.档案&&ex.source.npc.档案.姓名||typed||'').trim();if(type==='NPC')return String(ex.source&&ex.source.name||typed||'').trim();if(type==='能力'){var a=ex.data.ability||{};return String(xywsAutoAbilityName(a)).slice(0,120);}if(type==='装束')return typed||('变身装束 · '+xywsExcerpt(ex.body,18));if(type==='物品')return typed;if(type==='开局')return typed||xywsExcerpt(picked[0]||'',28)||'未命名开局';if(type==='规则'){var rr=picked[0];return typed||('规则 · '+xywsExcerpt(rr&&rr.text?rr.text:rr,24));}if(type==='玩法')return typed||'未命名玩法';return typed||'未命名作品';
    }
    function xywsAutoSummary(type,title,picked,ex){
      if(type==='角色'){var r=ex.source.npc,d=r.档案,st=r.状态,rel=r.关系,nt=xywsNpcNotes(ex.source.notes);return xywsExcerpt([d.种族,d.身份,d.能力系别,st.战服,rel.与主角关系,nt.personality,d.外貌].filter(Boolean).join(' · '),84);}if(type==='NPC'){var p=ex.source||{};return xywsExcerpt([xywsSupportKindLabel(p.kind),p.role,p.personality,p.ability,p.relation].filter(Boolean).join(' · '),84);}if(type==='能力'){var a=ex.data.ability||{};return xywsExcerpt([a.skillName,a.school,a.skillType,a.effect].filter(Boolean).join(' · '),84);}if(type==='物品'){var it=ex.data.item||{};return xywsExcerpt([it.category,'×'+(it.quantity||1),it.description].filter(Boolean).join(' · '),84);}return xywsExcerpt(ex.body||(picked&&picked[0]&&picked[0].text)||picked&&picked[0]||title,84);
    }
    function xywsConfigurePublishChrome(type){
      var nw=$('[data-pubname-wrap]'),dw=$('[data-pubdesc-wrap]'),nl=$('[data-pubnamelabel]'),dl=$('[data-pubdesclabel]');if(nw)nw.style.display='';if(dw)dw.style.display=(type==='玩法'||type==='开局'||type==='规则')?'':'none';if(nl)nl.textContent='作品名称';if(dl)dl.textContent='内容 / 正文';
      if(type==='角色'||type==='NPC'||type==='能力'){if(nw)nw.style.display='none';}
      else if(type==='物品'){if(nl)nl.textContent='物品名称';}
      else if(type==='装束'){if(nl)nl.textContent='装束名称（选填）';}
      else if(type==='开局'){if(nl)nl.textContent='开局名称（选填）';}
      else if(type==='规则'){if(nl)nl.textContent='规则名称（选填）';}
      else if(type==='玩法'){if(nl)nl.textContent='玩法名称';}
      if(dl){if(type==='玩法')dl.textContent='玩法内容';else if(type==='开局')dl.textContent='开局正文';else if(type==='规则')dl.textContent='规则正文';}
    }
    function openPublish(type){
      pubType=type;xywsPublishMode='create';xywsEditingWork=null;overlay.__xywsNpcLegacySource=null;var needsPicker=type==='角色'||type==='规则';overlay.__xywsSources=needsPicker?pubSource(type):[];overlay.__xywsPickedIds=[];overlay.__xywsImportSeed=null;
      var title=type==='角色'?'发布人物':(type==='NPC'?'发布生灵 / 配角':(type==='开局'?'发布开局':(type==='玩法'?'创建玩法':(type==='装束'?'发布变身装束':(type==='能力'?'发布能力 / 招式':(type==='物品'?'发布物品':'发布'+type))))));$('[data-pubtitle]').textContent=title;
      $('[data-pubhint]').textContent=type==='角色'?'人物只保留长期重要人物所需的常用字段；星灵、魔物、使魔、路人请使用“生灵 / 配角”。除姓名外都可不填。':(type==='NPC'?'轻量配角通常写名称 + 一两项特征就够了；不会进入重要人物变量或 NPC 控制台。':(type==='玩法'?'写清核心玩法、推进方式、失败后果与 AI 边界即可。':(type==='开局'?'写清时间地点、玩家现状、事件引子与 AI 边界即可。':(type==='装束'?'先写整体描述；确有需要再展开少量补充。':(type==='能力'?'按现有招式变量填写档位、系别、类型、蓝耗和效果；名称可留空，发布时自动生成。':(type==='物品'?'名称 + 作用通常就够了。':'写清规则本身；条件与例外按需补充。'))))));
      var pickBtn=$('[data-pickbtn]');if(pickBtn){pickBtn.style.display=needsPicker?'':'none';pickBtn.textContent='选择发布内容';}var typeWrap=$('[data-pubtype-wrap]');if(typeWrap)typeWrap.hidden=true;var pbtn=$('[data-publish-btn]');if(pbtn)pbtn.textContent='发布到云端';xywsConfigurePublishChrome(type);$('[data-pubname]').value='';$('[data-pubsummary]').value='';$('[data-pubdesc]').value='';$('[data-pubtags]').value='';xywsRenderPublishExtra(type);
      if(type==='开局'){var cur=parseCurrent(),r=String((cur&&cur.route)||'').trim();if(!r){toast('当前没有可发布的开局');show('create');return;}overlay.__xywsSources=[{id:'current_route',label:r,value:r}];overlay.__xywsPickedIds=['current_route'];$('[data-pubdesc]').value=r;$('[data-pubdesc]').setAttribute('placeholder','【时间 / 地点】\n【玩家现状】\n【开场事件 / 引子】\n【AI边界】不要替玩家决定尚未表达的行动、选择或内心');}
      else if(type==='玩法'){$('[data-pubname]').value='我的新玩法';$('[data-pubdesc]').value='【核心玩法】\n玩家主要体验什么、平时会做什么……\n\n【如何推进】\n剧情 / 回合怎么向前走……\n\n【失败与后果】\n失败会怎样，哪些后果允许持续……\n\n【AI边界】\nAI必须遵守什么；哪些事不能替玩家决定……';}
      else if(type==='规则'){$('[data-pubdesc]').setAttribute('placeholder','【规则】必须 / 禁止什么\n\n【生效条件（选填）】什么时候适用\n\n【例外 / 解除（选填）】哪些情况不适用、如何结束');}
      updatePickLabel();show('publish');
    }
    function xywsSplitRuleText(v){var s=String(v||'').trim();if(!s)return [];var a=s.split(/\n\s*\n+/).map(function(x){return x.trim();}).filter(Boolean);return a.length?a:[s];}
    function xywsCollectPublishDraft(){
      var type=pubType,sources=overlay.__xywsSources||[],pickedIds=(overlay.__xywsPickedIds||[]).map(String),picked=sources.filter(function(x){return pickedIds.indexOf(String(x.id))>=0;}).map(function(x){return x.value;});
      var ex=xywsReadPublishExtra(type);if(!ex.ok)return ex;if(type==='NPC'||type==='角色')picked=[ex.source];var title=xywsPublishTitle(type,picked,ex);if(type==='角色'&&!title)return {ok:false,msg:'请填写人物姓名'};if(type==='NPC'&&!title)return {ok:false,msg:'请填写生灵 / 配角名称'};if(type==='物品'&&!title)return {ok:false,msg:'请填写物品名称'};if(type==='玩法'&&!title)return {ok:false,msg:'请填写玩法名称'};
      var tags=String($('[data-pubtags]').value||'').split(/[，,]/).map(function(x){return x.trim();}).filter(Boolean),body='',source=picked;
      var isWorldbookUpload=xywsPublishMode==='import-upload'&&xywsEditingWork&&xywsEditingWork.xywsImportFormat==='sillytavern.worldbook';
      if(type==='玩法'||type==='开局'||type==='规则'){
        var rawBody=String($('[data-pubdesc]').value||'');body=isWorldbookUpload?rawBody:rawBody.trim();
      }else if(ex.body)body=ex.body;
      if(type==='玩法'&&!String(body).trim())return {ok:false,msg:'请填写玩法内容'};if(type==='开局'&&!String(body).trim())return {ok:false,msg:'请填写开局正文'};if(type==='规则'&&!String(body).trim())return {ok:false,msg:'请填写规则正文'};
      if(type==='规则')source=isWorldbookUpload?[{id:'draft_rule_raw',text:body,on:true,xywsPreserveRaw:true}]:xywsSplitRuleText(body).map(function(x,i){return {id:'draft_rule_'+i,text:x,on:true};});else if(type==='开局')source=[body];
      var typedSummary=String(($('[data-pubsummary]')||{}).value||'').trim(),work={id:'draft_'+Date.now(),xywsProtocol:XYWS_PACKAGE_VERSION,type:type,icon:ICON[type]||'✦',title:title,desc:typedSummary,body:body,tags:tags,likes:0,uses:0,source:source,created:Date.now()};Object.keys(ex.data||{}).forEach(function(k){work[k]=ex.data[k];});
      if(isWorldbookUpload&&(type==='角色'||type==='NPC')){var rawEl=$('[data-import-raw-content]');work.body=rawEl?String(rawEl.value||''):String(xywsEditingWork.xywsRawContent||'');work.xywsRawContent=work.body;}
      if(xywsEditingWork&&xywsPublishMode==='cloud-edit'){work.id='cloud:'+String(xywsEditingWork.xywsOriginId||'');work.xywsCloud=true;work.xywsOriginId=String(xywsEditingWork.xywsOriginId||'');work.xywsAuthor=String(xywsEditingWork.xywsAuthor||'');work.created=xywsEditingWork.created||work.created;work.likes=Number(xywsEditingWork.likes)||0;work.uses=Number(xywsEditingWork.uses)||0;}
      xywsEnsureSummary(work);return {ok:true,work:work};
    }
    function xywsRemapImportedWork(seed,targetType){
      seed=xywsClone(seed)||{};if(seed.type===targetType)return seed;var hasRaw=typeof seed.xywsRawContent==='string',raw=hasRaw?seed.xywsRawContent:String(xywsWorkBody(seed)||''),title=String(seed.title||'未命名作品').trim()||'未命名作品';var w={id:seed.id||('import_'+Date.now()),xywsImported:true,xywsImportFormat:String(seed.xywsImportFormat||''),xywsAuthor:String(seed.xywsAuthor||''),type:targetType,icon:ICON[targetType]||'✦',title:title,desc:String(seed.desc||''),tags:Array.isArray(seed.tags)?seed.tags.slice():[],likes:Number(seed.likes)||0,uses:Number(seed.uses)||0,created:seed.created||Date.now(),body:raw,source:[]};if(hasRaw)w.xywsRawContent=raw;
      if(targetType==='角色'){var pr=xywsSanitizeNpcRecord({档案:{姓名:title,种族:'',身份:'',外貌:''},关系:{与主角关系:'',钩子:'',秘密:''}},'other');w.source=[xywsNpcSourceFromRecord(pr,'other','',{freeform:raw})];}
      else if(targetType==='NPC'){w.source=[{kind:xywsSupportKindGuess([title,raw].join(' ')),name:title,role:'',appearance:'',personality:'',ability:'',relation:'',debut:'',notes:raw,include:true}];}
      else if(targetType==='开局'){w.source=String(raw).trim()?[raw]:[];}else if(targetType==='规则'){w.source=hasRaw?[{id:'import_rule_raw',text:raw,on:true,xywsPreserveRaw:true}]:xywsSplitRuleText(raw).map(function(x,i){return {id:'import_rule_'+i,text:x,on:true};});}else if(targetType==='装束'){w.outfit={description:raw};}else if(targetType==='能力'){w.ability={skillName:title,slot:'基础攻防',school:'未分类',skillType:'',mpCost:0,effect:raw};}else if(targetType==='物品'){w.item={category:hasRaw?'世界书导入':'导入作品',quantity:1,description:raw};}xywsEnsureSummary(w);return w;
    }
    function xywsPopulatePublishFromWork(w,mode){
      if(!w)return;xywsPublishMode=mode||'import-upload';xywsEditingWork=w;pubType=w.type;overlay.__xywsSources=[];overlay.__xywsPickedIds=[];overlay.__xywsNpcLegacySource=null;var typeWrap=$('[data-pubtype-wrap]'),typeSel=$('[data-pubtype]');if(typeWrap)typeWrap.hidden=xywsPublishMode!=='import-upload';if(typeSel)typeSel.value=pubType;var title=xywsPublishMode==='cloud-edit'?'编辑我的作品':'导入作品上传';$('[data-pubtitle]').textContent=title;$('[data-pubhint]').textContent=xywsPublishMode==='cloud-edit'?'修改后保存到原云端作品，不需要先删除。简介仍可留空自动生成短简介。':'发布前可修改栏目、名称、简介与内容；人物和生灵会按两套不同结构处理。';var pickBtn=$('[data-pickbtn]');if(pickBtn)pickBtn.style.display='none';xywsConfigurePublishChrome(pubType);xywsRenderPublishExtra(pubType);$('[data-pubname]').value=String(w.title||'');$('[data-pubsummary]').value=String(w.desc||'');$('[data-pubtags]').value=(w.tags||[]).join('，');$('[data-pubdesc]').value='';
      if(pubType==='玩法')$('[data-pubdesc]').value=String(w.body||'');else if(pubType==='开局')$('[data-pubdesc]').value=xywsOpeningText(w);else if(pubType==='规则')$('[data-pubdesc]').value=xywsRuleTexts(w).join('\n\n');else if(pubType==='角色'){var ps=xywsWorkNpcSources(w);if(ps.length)xywsPopulateNpcPublish(ps[0],pubType);}else if(pubType==='NPC'){var ss=xywsWorkSupportSources(w);if(ss.length)xywsPopulateSupportPublish(ss[0],w);}
      if((pubType==='角色'||pubType==='NPC')&&xywsPublishMode==='import-upload'&&w.xywsImportFormat==='sillytavern.worldbook'){var extra=$('[data-pubextra]');if(extra){var raw=typeof w.xywsRawContent==='string'?w.xywsRawContent:String(w.body||'');extra.insertAdjacentHTML('afterbegin','<div class="xyws-field"><label>世界书原文（保留）</label><textarea data-import-raw-content></textarea><div class="xyws-source" style="margin-top:6px">原文独立保留；人物只填写合法重要人物字段，生灵只保存轻量配角设定。工坊不会自动把整段原文塞进钩子、秘密或新变量。</div></div>');var rawBox=$('[data-import-raw-content]');if(rawBox)rawBox.value=raw;}}
      else if(pubType==='装束'){var od=w.outfit||{};var oe=$('[data-outfit-desc]');if(oe)oe.value=String(od.description||w.body||'');}else if(pubType==='能力'){var a=w.ability||{};var an=$('[data-ability-name]'),as=$('[data-ability-slot]'),asc=$('[data-ability-school]'),at=$('[data-ability-type]'),ac=$('[data-ability-cost]'),ae=$('[data-ability-effect]');if(an)an.value=String(a.skillName||w.title||'');if(as&&a.slot)as.value=String(a.slot);if(asc)asc.value=String(a.school||'未分类');if(at)at.value=String(a.skillType||'');if(ac)ac.value=(a.mpCost===undefined||a.mpCost===null||Number.isNaN(Number(a.mpCost)))?'0':String(a.mpCost);if(ae)ae.value=String(a.effect||w.body||'');}else if(pubType==='物品'){var it=w.item||{};var ic=$('[data-item-category]'),iq=$('[data-item-qty]'),id=$('[data-item-desc]');if(ic)ic.value=String(it.category||'杂物');if(iq)iq.value=String(Number(it.quantity)||1);if(id)id.value=String(it.description||w.body||'');}
      var pbtn=$('[data-publish-btn]');if(pbtn)pbtn.textContent=xywsPublishMode==='cloud-edit'?'保存修改':'发布到云端';show('publish');
    }
    function xywsOpenCloudEdit(w){if(!xywsCanEditCloud(w)){toast('只能编辑当前账号自己的云端作品');return;}xywsPopulatePublishFromWork(w,'cloud-edit');}
    function xywsOpenImportedUpload(w){if(!w)return;overlay.__xywsImportSeed=xywsClone(w)||w;xywsPopulatePublishFromWork(w,'import-upload');overlay.__xywsImportSeed=xywsClone(w)||w;}
    function xywsSwitchImportedUploadType(type){
      if(xywsPublishMode!=='import-upload'||!overlay.__xywsImportSeed)return;var mapped=xywsRemapImportedWork(overlay.__xywsImportSeed,type);xywsPopulatePublishFromWork(mapped,'import-upload');overlay.__xywsImportSeed=overlay.__xywsImportSeed||mapped;var sel=$('[data-pubtype]');if(sel)sel.value=type;
    }
    function publishLocal(){var c=xywsCollectPublishDraft();if(!c.ok){toast(c.msg);return;}var work=c.work;work.id='mine_'+Date.now();var mine=arr(LS_MINE);mine.unshift(work);setLS(LS_MINE,JSON.stringify(mine));toast('已保存本地测试作品，可在“我的”里查看并安装');setTimeout(function(){show('mine');},350);}
    function xywsUpsertLocalMirror(originId,draft,serverWork){
      var id=String(originId||'').trim();if(!id)return;var mine=arr(LS_MINE),mirror=xywsClone(draft)||{},found=false;
      mirror.id='cloud:'+id;mirror.xywsCloud=true;mirror.xywsOriginId=id;mirror.xywsImported=false;
      if(serverWork&&serverWork.author&&serverWork.author.displayName)mirror.xywsAuthor=String(serverWork.author.displayName);
      else if(serverWork&&serverWork.author_display_name)mirror.xywsAuthor=String(serverWork.author_display_name);
      if(serverWork&&serverWork.createdAt)mirror.created=serverWork.createdAt;else if(serverWork&&serverWork.created_at)mirror.created=serverWork.created_at;
      mine=mine.map(function(m){if(m&&(String(m.xywsOriginId||'')===id||String(m.id||'')==='cloud:'+id)){found=true;return mirror;}return m;});
      if(!found)mine.unshift(mirror);setLS(LS_MINE,JSON.stringify(mine));
    }
    function publishCloud(){
      var c=xywsCollectPublishDraft();if(!c.ok){toast(c.msg);return;}var draft=c.work,canonical=null;try{canonical=xywsCanonicalWork(draft);}catch(e){toast('作品内容构建失败');return;}
      var A=xywsAuthApi(),prof=(A&&typeof A.getDiscordProfile==='function')?A.getDiscordProfile():null,displayName=(prof&&(prof.global_name||prof.username))?String(prof.global_name||prof.username).trim():'',avatar='';if(prof&&prof.id&&prof.avatar)avatar='https://cdn.discordapp.com/avatars/'+encodeURIComponent(prof.id)+'/'+encodeURIComponent(prof.avatar)+'.png?size=128';
      var isEdit=xywsPublishMode==='cloud-edit',btn=$('[data-a="publish"]'),op=null,originId=isEdit&&xywsEditingWork?String(xywsEditingWork.xywsOriginId||''):'';
      if(isEdit){
        var M=xywsManageApi();if(!M||typeof M.updateWork!=='function'){toast('当前客户端已准备好编辑界面，但云端管理后端尚未提供更新接口');return;}
        op=Promise.resolve(M.updateWork(originId,canonical,{displayName:displayName,avatar:avatar}));
      }else{
        var CW=(typeof window!=='undefined'&&window.__XYWS_CLOUD_WRITE__)?window.__XYWS_CLOUD_WRITE__:null;try{if(!CW&&typeof globalThis!=='undefined')CW=globalThis.__XYWS_CLOUD_WRITE__;}catch(e){}if(!CW||typeof CW.publishWork!=='function'){toast('云端发布模块未加载');return;}
        op=Promise.resolve(CW.publishWork(canonical,{displayName:displayName,avatar:avatar}));
      }
      if(btn){btn.disabled=true;btn.textContent=isEdit?'保存中…':'发布中…';}
      op.then(function(serverWork){
        var sid=isEdit?originId:String(serverWork&&serverWork.id||'').trim();if(!sid)throw new Error(isEdit?'云端修改结果异常':'云端发布结果异常');
        xywsUpsertLocalMirror(sid,draft,serverWork);
        return Promise.all([xywsRefreshCloud(true),xywsSyncManage(true)]).then(function(){toast(isEdit?'修改已保存到云端':'已发布到云端');setTimeout(function(){show(isEdit?'mine':'home');},350);});
      }).catch(function(err){try{console.error(isEdit?'[XYWS Manage] update failed:':'[XYWS Cloud Write] publish failed:',err&&err.message?err.message:String(err));}catch(e){}toast((err&&err.message)?err.message:(isEdit?'保存修改失败，请稍后重试':'发布失败，请稍后重试'));}).then(function(){if(btn){btn.disabled=false;btn.textContent=isEdit?'保存修改':'发布到云端';}});
    }

    function bindOverlay(){
      overlay.addEventListener('click',async function(e){
        var t=e.target.closest?e.target.closest('button,[data-open]'):e.target;
        if(!t)return;
        if(t.getAttribute('data-a')==='close'){
          if(currentScreen==='detail'){show(prevScreen||'home');return;}
          if(currentScreen==='publish'){show(xywsPublishMode==='create'?'create':'mine');return;}
          if(currentScreen==='picksource'){show('publish');return;}
          if(currentScreen==='importmap'){xywsPendingImport=null;show('mine');return;}
          close(); return;
        }
        if(t.getAttribute('data-a')==='auth-login'){
          var A=xywsAuthApi();
          if(!A||typeof A.login!=='function'){toast('认证模块未加载');return;}
          var authBtn=t;
          if(authBtn.disabled)return;
          authBtn.disabled=true;
          var oldText=authBtn.textContent;
          authBtn.textContent='正在打开 Discord…';
          try{
            await A.login(win);
            authBtn.textContent=oldText;
            authBtn.disabled=false;
            toast('Discord 登录成功');
            xywsEnterHome();
          }catch(err){
            authBtn.textContent=oldText;
            authBtn.disabled=false;
            try{
              console.error('[XYWS Auth] workshop login failed:', err&&err.message?err.message:String(err));
            }catch(e){}
            toast((err&&err.message)?err.message:'登录失败，请重试');
            xywsEnterAuth();
          }
          return;
        }
        if(t.getAttribute('data-a')==='auth-logout'){
          var A2=xywsAuthApi();
          if(A2&&typeof A2.logout==='function'){try{await A2.logout();}catch(e){}}
          xywsProbeOk=false;xywsManageWorks=[];xywsManageLoaded=false;xywsManageLoading=false;xywsManageIsAdmin=false;xywsStopAutoSync();
          toast('已退出登录');
          currentScreen='auth';
          xywsEnterAuth();
          return;
        }
        if(t.getAttribute('data-a')==='auth-probe'){
          var A3=xywsAuthApi();
          if(!A3||typeof A3.probeIdentity!=='function'){toast('认证模块未加载');return;}
          var probeBtn=t;
          if(probeBtn.disabled)return;
          probeBtn.disabled=true;
          var oldProbeText=probeBtn.textContent;
          probeBtn.textContent='验证中…';
          try{
            await A3.probeIdentity();
            xywsProbeOk=true;
            toast('云端身份验证成功');
            renderMine();
          }catch(err){
            probeBtn.disabled=false;
            probeBtn.textContent=oldProbeText;
            try{
              console.error('[XYWS Auth] identity probe failed:', err&&err.message?err.message:String(err));
            }catch(e){}
            toast((err&&err.message)?err.message:'云端身份验证失败');
          }
          return;
        }
        if(!xywsLoggedIn()){
          toast('请先使用 Discord 登录');
          return;
        }
        var go=t.getAttribute('data-go'); if(go){show(go);return;}
        var nav=t.getAttribute('data-nav'); if(nav){show(nav);return;}
        var cat=t.getAttribute('data-cat'); if(cat){currentCat=cat;renderHome();return;}
        var more=t.getAttribute('data-more'); if(more){currentCat=more;renderHome();return;}
        var deleteId=t.getAttribute('data-delete-work');if(deleteId){var deleted=await xywsDeleteCloudWork(deleteId,t.getAttribute('data-delete-title')||'');if(deleted)renderMine();return;}
        var editId=t.getAttribute('data-edit-work');if(editId){var ew=byId(editId);if(ew)xywsOpenCloudEdit(ew);else toast('没有找到要编辑的作品');return;}
        var uploadId=t.getAttribute('data-upload-work');if(uploadId){var uw=byId(uploadId);if(uw)xywsOpenImportedUpload(uw);else toast('没有找到要上传的作品');return;}
        var oid=t.getAttribute('data-open'); if(oid){openDetail(oid);return;}
        var pub=t.getAttribute('data-pub'); if(pub){openPublish(pub);return;}
        if(t.hasAttribute('data-pick-open')){renderPick();show('picksource');return;}
        var mt=t.getAttribute('data-mt'), mid=t.getAttribute('data-mid');
        if(mt&&mid){var now=await xywsToggleManaged(mt,mid);if(now===null){toast('状态切换失败：当前 MVU / 持续挂载接口不可用');return;}toast(now?'已开启，将继续长期生效':'已关闭，安装数据仍保留');if(currentScreen==='home'&&currentCat==='已启用')renderHome();else renderMine();return;}
        var mr=t.getAttribute('data-mr'), mrid=t.getAttribute('data-mrid');
        if(mr&&mrid){var removed=await xywsRemoveManaged(mr,mrid);toast(removed?'已从本局清除':'清除失败：当前持续挂载接口不可用');if(currentScreen==='home'&&currentCat==='已启用')renderHome();else renderMine();return;}
        var act=t.getAttribute('data-a');
        if(act==='install-opening'){await installPerson('opening');return;}
        if(act==='install-now'){await installPerson('now');return;}
        if(act==='install'){await installCurrent();return;}
        if(act==='export-work'&&currentWork){var exportedWork=currentWork,exported=xywsExportWork(exportedWork);if(exported)xywsTrackCloudDownload(exportedWork);toast(exported?'作品包已导出':'导出失败');return;}
        if(act==='edit-cloud'&&currentWork){if(xywsCanEditCloud(currentWork))xywsOpenCloudEdit(currentWork);else if(currentWork.xywsImported||String(currentWork.id||'').indexOf('mine_')===0)xywsOpenImportedUpload(currentWork);else toast('只能编辑当前账号自己的云端作品');return;}
        if(act==='delete-cloud'&&currentWork&&currentWork.xywsOriginId){var oldScreen=prevScreen||'home',okdel=await xywsDeleteCloudWork(currentWork.xywsOriginId,currentWork.title);if(okdel){currentWork=null;show(oldScreen==='detail'?'home':oldScreen);}return;}
        if(act==='import-pack'){var fi=$('[data-import-file]');if(fi){fi.value='';fi.click();}return;}
        if(act==='import-cancel'){xywsPendingImport=null;show('mine');return;}
        if(act==='import-confirm'){xywsConfirmWorldbookImport();return;}
        if(act==='export-mine'){toast(xywsExportMine()?'已导出我的作品包':'没有可导出的作品');return;}
        if(act==='fav'&&currentWork){var on=toggleStore(LS_FAV,currentWork.id);t.textContent=on?'★ 已收藏':'☆ 收藏';toast(on?'已收藏':'已取消收藏');return;}
        if(act==='like'&&currentWork){if(currentWork.xywsCloud&&currentWork.xywsOriginId){await xywsToggleCloudLike(currentWork,t);return;}var on2=toggleStore(LS_LIKED,currentWork.id);t.textContent=on2?'♥ 已点赞':'♡ 点赞';toast(on2?'已点赞':'已取消点赞');return;}
        if(act==='npc-add-body'){xywsNpcAppendBody({},'');return;}
        if(act==='npc-add-skill'){xywsNpcAppendSkill({},'');return;}
        if(act==='npc-add-gear'){xywsNpcAppendGear({},'');return;}
        if(act==='npc-add-item'){xywsNpcAppendItem({},'');return;}
        if(act==='npc-add-injury'){xywsNpcAppendInjury('','');return;}
        if(act==='npc-del-row'){var row=t.closest?t.closest('.xyws-npcrow'):null;if(row)row.remove();return;}
        if(act==='publish'){publishCloud();return;}
        if(act==='pick-cancel'){ show('publish'); return; }
        if(act==='pick-done'){ confirmPick(); return; }
      });
      overlay.addEventListener('change',function(e){
        var el=e&&e.target;if(!el||el.getAttribute('data-npc')!=='kind')return;var race=$('[data-npc="race"]');if(!race)return;var cur=String(race.value||'').trim();if(!cur||cur==='魔法少女'||cur==='魔人'||cur==='凡人')race.value=xywsNpcRaceForKind(String(el.value||''));
      });
      try{win.addEventListener('focus',function(){xywsAutoSyncNow('focus');});}catch(e){}
      try{doc.addEventListener('visibilitychange',function(){if(!doc.visibilityState||doc.visibilityState==='visible')xywsAutoSyncNow('visibility');});}catch(e){}
      var q=$('[data-q]'); if(q)q.addEventListener('input',renderHome);
      var typeSel=$('[data-pubtype]');if(typeSel)typeSel.addEventListener('change',function(){xywsSwitchImportedUploadType(String(typeSel.value||'玩法'));});
      var fi=$('[data-import-file]');if(fi)fi.addEventListener('change',function(){var f=fi.files&&fi.files[0];if(f)xywsReadImportFile(f);});
    }

    xywsInitPlayPacerBridge();
    setTimeout(function(){xywsInitPlayPacerBridge();},1200);
    setTimeout(function(){xywsInitPlayPacerBridge();},3500);
    var btn=doc.getElementById(buttonId);
    if(btn) btn.onclick=function(e){if(e){e.stopPropagation();if(e.preventDefault)e.preventDefault();}open();};
    win.__XYWS_OPEN__=open;

    // 同标签页 OAuth 返回后，auth.js 会在页面启动阶段完成 bridge 解密与 CloudBase signin。
    // 这里等待该一次性结果：成功则自动重新打开工坊首页，失败则打开登录页并保留明确报错。
    try{
      var authReadyApi=xywsAuthApi();
      if(authReadyApi&&typeof authReadyApi.whenRedirectReady==='function'){
        Promise.resolve(authReadyApi.whenRedirectReady()).then(function(result){
          if(!result||!result.handled)return;
          open();
          if(result.ok&&authReadyApi.isLoggedIn&&authReadyApi.isLoggedIn()){
            toast('Discord 登录成功');
            xywsEnterHome();
          }else{
            xywsEnterAuth();
            var msg=(result&&result.error)?result.error:'登录失败，请重试';
            try{console.error('[XYWS Auth] workshop redirect login failed:',msg);}catch(e){}
            toast(msg);
          }
        }).catch(function(err){
          open();
          xywsEnterAuth();
          var msg=(err&&err.message)?err.message:String(err||'登录失败，请重试');
          try{console.error('[XYWS Auth] workshop redirect login failed:',msg);}catch(e){}
          toast(msg);
        });
      }
    }catch(e){}
  }

  try {
    if (typeof window !== 'undefined') { window.__XYWS_WORKSHOP__ = { install: install }; }
    try { if (typeof globalThis !== 'undefined') { globalThis.__XYWS_WORKSHOP__ = globalThis.__XYWS_WORKSHOP__ || window.__XYWS_WORKSHOP__; } } catch (e2) {}
  } catch (e) { try { if (typeof console !== 'undefined') console.error('[星海工坊] 暴露安装器失败', e); } catch (_e) {} }
})();
