// No credentials or browser storage here. The caller supplies a session-only API client.
export function decodeGitHubFile(file){return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0))));}
export async function readRemoteState(api,repo,sha){
  const files=await Promise.all(['site-edits.json','editorial-articles.json'].map(path=>api(`/repos/${repo}/contents/${path}?ref=${sha}`)));
  return {edits:decodeGitHubFile(files[0]),articles:decodeGitHubFile(files[1])};
}
export async function commitContent(api,{repo,baseline,candidate,images=[],message,onProgress=()=>{}}){
  const progress=onProgress;
  progress('正在检查远端版本…');
  const ref=await api(`/repos/${repo}/git/ref/heads/main`),head=ref.object.sha;
  const remote=await readRemoteState(api,repo,head);
  if(JSON.stringify(remote)!==JSON.stringify(baseline))throw new Error('其他编辑者已更新内容。草稿已保留；请导出备份并刷新，合并修改后再发布。');
  const parent=await api(`/repos/${repo}/git/commits/${head}`),entries=[];
  for(const [path,image] of images){
    if(!/^\/assets\/uploads\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp|gif)$/.test(path))throw new Error('上传图片路径不合法。');
    progress('正在上传图片…');const blob=await api(`/repos/${repo}/git/blobs`,{method:'POST',body:{content:image.base64,encoding:'base64'}});
    entries.push({path:'docs'+path,mode:'100644',type:'blob',sha:blob.sha});
  }
  entries.push({path:'site-edits.json',mode:'100644',type:'blob',content:JSON.stringify(candidate.edits,null,2)+'\n'},{path:'editorial-articles.json',mode:'100644',type:'blob',content:JSON.stringify(candidate.articles,null,2)+'\n'});
  progress('正在保存修改…');
  const tree=await api(`/repos/${repo}/git/trees`,{method:'POST',body:{base_tree:parent.tree.sha,tree:entries}});
  const next=await api(`/repos/${repo}/git/commits`,{method:'POST',body:{message:'Content Studio: '+(message?.trim()||'update Nabla website content'),tree:tree.sha,parents:[head]}});
  // No force push: simultaneous edits produce diverging commits and are rejected by GitHub.
  await api(`/repos/${repo}/git/refs/heads/main`,{method:'PATCH',body:{sha:next.sha,force:false}});
  return next;
}
