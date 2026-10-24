import { editorialArt, visualMasthead } from './page-visuals.mjs';
export const editorial = {
  url: '/editorial/an-exciting-and-unsettling-age/',
  title: 'An Exciting and Unsettling Age',
  chineseTitle: '在一个令人兴奋，也令人不安的时代',
  date: '2026-10-18',
  abstract: 'Nabla Editorial begins as a record of how young researchers experience a changing world. Emerging from informal group discussions, this series explores research, technology, work and everyday life, with particular attention to the opportunities and uncertainties of artificial intelligence. It aims to preserve questions, disagreements and evolving perspectives, rather than predict the future.',
  sections: [
    ['从组会开始', [
      'Nabla 社论源于课题组的日常组会。除了具体的科研工作，我也希望和大家谈谈科研、技术、职业发展、金钱、社会，以及个人生活。这些思考有时来自实际经历，有时只是对最近发生的事情的观察，未必系统，也未必成熟。',
      '作为一名从事计算流体力学、流体力学及相关工程研究的博士生，我希望把这些讨论中的问题和思考记录下来。最初，它们只是团队内部的非正式交流；但在思考人工智能及其社会影响时，我逐渐觉得，这些记录也许有超越组会本身的意义。'
    ]],
    ['令人兴奋，也令人不安', [
      '这是一个既让人兴奋，又让人不安的时代。',
      '人工智能正在改变我们获取知识、编写代码、分析数据和开展科学计算的方式。许多过去耗费大量时间的工作，如今可以借助新的工具更快完成。一些受限于个人能力、工具与资源的研究设想，也可能逐渐变得可行。对年轻科研工作者而言，个人能够尝试的事情正在变多，这令人兴奋。',
      '但机会与不确定性同时出现。今天投入时间学习的知识与技能，未来是否仍然有价值？数年的博士训练，究竟在培养怎样的能力？当 AI 越来越擅长阅读文献、编写代码、执行模拟和分析数据时，人类研究者的核心价值是什么？',
      '问题也不止于科研。效率的提升能否转化为更好的生活？技术收益能否被更广泛地分享？就业、教育和科研评价又会怎样变化？这些问题没有现成的答案。让我感到不安的，不只是技术本身，还有变化的速度，以及我们能否理解和适应这些变化。'
    ]],
    ['我们将在其中扮演什么角色', [
      '我们或许正在经历一场由人工智能推动的新工业革命。这是一个值得思考的可能性，而不是关于未来的确定结论。',
      '令人兴奋的是，我们可能正在见证历史；令人不安的是，我们不知道自己将在这段历史中扮演什么角色。',
      '我们既受益于技术，也承担它带来的不确定性。我们期待科研更高效，也会追问科研工作的意义是否正在改变。这些矛盾不必立即得到解决，它们本身就是值得记录的时代经验。',
      '因此，Nabla 社论希望保持开放、理性和真实：既关注新的可能，也认真面对问题；既保留期待，也诚实表达困惑。'
    ]],
    ['为什么要持续记录', [
      '后来的人回顾一个时代时，往往已经知道结果：哪些技术成功，哪些预测落空，哪些选择改变了人生。但生活在其中的人并不知道这些。未来的不确定性，正是当下经验的一部分。',
      '我关心的，是普通人，尤其是年轻科研工作者，如何理解和经历这样的变化。2026 年的一名博士生如何看待 AI？如何理解研究工作的价值和职业前景？又如何平衡科研、收入、社交与生活？',
      '记录这些思考，不只是留下结论，也是在留下观点形成时的环境、期待和局限。今天的判断可能在未来被证明有误，但认真而诚实的记录，依然能够呈现当时的人们如何认识世界。',
      '我们不需要假装能够预测未来，也不必追求每一期都正确。有时，一个尚未回答的好问题，就值得写下来。'
    ]],
    ['让观点留下时间的痕迹', [
      'Nabla 社论将保留文章的首次发表日期和原始论述。日后出现新的认识，可以通过新的文章、注明日期的后记或注释补充。事实或文字上的更正，也应说明更正内容与时间，避免让后来的认识悄悄覆盖曾经的判断。',
      '我们希望记录过程，而不只是结论。讨论中的分歧、没有形成共识的问题，同样值得被看见。公开引用其他成员的观点前，应征得本人同意；必要时匿名处理，并确认匿名方式符合其意愿。',
      '所有 Nabla 成员都可以署名撰文。每位作者保有自己的声音，文章代表署名作者在发表时的思考，不要求成为团队的共同立场。'
    ]],
    ['写给未来，也写给现在', [
      'Nabla 社论将从科研与日常生活出发，持续讨论技术、职业、金钱、社会，以及我们与时代的关系。它没有预设的完整答案，也不承诺固定的更新频率。我们希望在值得思考的时候，留下认真思考过的文字。',
      '或许多年以后，这些文字能够成为新工业革命历史中一个微小而真实的缩影。即使没有，它们也记录了我们如何在变化之中提问、交流，并寻找自己的位置。',
      '这就是我们开始写作的理由。'
    ]]
  ]
};
export function editorialFeature(arrow) {
  return `<section class="editorial-feature section-space"><div class="wrap editorial-feature-grid"><div><span class="eyebrow">NABLA EDITORIAL · NABLA 社论</span><h2>Thinking through<br>a changing world.</h2><p lang="zh-Hans">记录科研、技术与生活中的问题，也记录我们如何改变自己的看法。</p><a class="inline-action" href="/editorial/">Explore Nabla Editorial ${arrow}</a></div><a class="editorial-feature-article" href="${editorial.url}"><span class="eyebrow">FOUNDING NOTE · 创刊说明</span><h3>${editorial.title}</h3><p lang="zh-Hans">${editorial.chineseTitle}</p><span>袁泳棋 / Yongqi Yuan · 18 October 2026 ${arrow}</span></a></div></section>`;
}
export function buildEditorial({page,writePage,arrow}) {
  const meta=`<div class="editorial-meta"><span>创刊说明 / Founding note</span><span>袁泳棋 / Yongqi Yuan</span><time datetime="${editorial.date}">18 October 2026</time></div>`;
  const card=`<a class="editorial-card" href="${editorial.url}"><span class="eyebrow">FOUNDING NOTE · 创刊说明</span><h2 lang="en">${editorial.title}</h2><p class="editorial-card-title" lang="zh-Hans">${editorial.chineseTitle}</p><p lang="en">${editorial.abstract}</p>${meta}<span class="inline-action">Read the founding note ${arrow}</span></a>`;
  const feedback=`<div class="editorial-feedback" lang="zh-Hans"><h2>邮件反馈</h2><p>欢迎通过邮件分享问题、不同意见或阅读反馈。未经同意，来信不会作为署名观点公开引用。</p><a class="inline-action" href="mailto:yongqi.yuan@eng.ox.ac.uk?subject=Nabla%20Editorial%20feedback">yongqi.yuan@eng.ox.ac.uk ${arrow}</a></div>`;
  const index=`${visualMasthead({title:'Nabla Editorial',intro:'Member essays on research, technology, careers and everyday life.',eyebrow:'NABLA LAB',kind:'editorial',members:[]})}<section class="wrap editorial-index"><div class="section-top"><div><span class="eyebrow">THE ARCHIVE</span><h2>2026</h2></div><span>01 essay</span></div>${card}<div class="editorial-principles" lang="zh-Hans"><h2>关于这个栏目</h2><div><h3>成员署名</h3><p>所有 Nabla 成员均可署名撰文。文章代表署名作者的观点，不要求形成团队共识。</p></div><div><h3>发表与更正记录</h3><p>保留原始论述与首次发表日期。后续认识以新文章、注明日期的注释或后记补充；更正保留说明。</p></div><div><h3>引用与反馈</h3><p>引用成员观点前征得本人同意，必要时经同意匿名处理。当前通过邮件交流读者反馈。</p></div></div>${feedback}</section>`;
  writePage('/editorial/',page('/editorial/','Nabla Editorial',index,'/editorial/','Nabla 社论：以中文文章、英文标题与摘要，记录年轻科研工作者对科研、人工智能、技术、职业与生活的思考。'));
  const body=`<article class="editorial-essay"><header class="editorial-essay-header"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/editorial/">Nabla Editorial</a><span>/</span><span aria-current="page">Founding note</span></nav><span class="eyebrow">NABLA EDITORIAL · 001</span><h1 lang="en">${editorial.title}</h1><p class="editorial-subtitle" lang="zh-Hans">${editorial.chineseTitle}</p>${meta}<div class="editorial-abstract" lang="en"><h2>Abstract</h2><p>${editorial.abstract}</p></div></header><div class="editorial-body" lang="zh-Hans"><p class="editorial-opening">这是一个既让人兴奋，又让人不安的时代。我们希望把生活在其中的思考，认真地记录下来。</p>${editorial.sections.map(([title,paras],i)=>`<section id="section-${i+1}"><h2>${title}</h2>${paras.map(p=>`<p>${p}</p>`).join('')}</section>`).join('')}<div class="editorial-record"><h2>发表记录</h2><p>首次发表：<time datetime="2026-10-18">2026 年 10 月 18 日</time>。本文为创刊说明。后续如有更正或补充，将在此标注日期与内容。</p><p>© 2026 袁泳棋 / Yongqi Yuan。本文代表署名作者的观点。</p></div>${feedback}<a class="inline-action" href="/editorial/">返回 Nabla 社论 ${arrow}</a></div></article>`;
  let html=page(editorial.url,editorial.title,body,'/editorial/',editorial.abstract).replace('<html lang="en">','<html lang="zh-Hans">');
  const data={'@context':'https://schema.org','@type':'Article',headline:editorial.title,alternativeHeadline:editorial.chineseTitle,inLanguage:'zh-Hans',datePublished:'2026-10-18',author:{'@type':'Person',name:'Yongqi Yuan',alternateName:'袁泳棋',url:'https://yongqi-yuan.com/'},description:editorial.abstract,mainEntityOfPage:'https://nabla.ac.cn'+editorial.url};
  html=html.replace('</head>','<script type="application/ld+json">'+JSON.stringify(data)+'</script></head>');
  writePage(editorial.url,html);
}
