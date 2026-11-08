(() => {
  const attribute = document.querySelector('#study-attribute');
  const model = document.createElement('select');
  model.id = 'study-model';
  for (const [value, name] of [['phi2','Phi-2'],['stablelm-3b','StableLM-3B'],['tinyllama','TinyLlama']]) model.add(new Option(name,value));
  const label = document.createElement('label');
  label.htmlFor = model.id; label.textContent = 'Model';
  const field = document.createElement('div'); field.className = 'study-model-field';
  field.append(label, model); document.querySelector('label[for="study-attribute"]').before(field);
  const output = document.querySelector('.study-feedback');
  output.setAttribute('aria-atomic','true');
  const source = document.createElement('a');
  source.className = 'text-link study-data-source'; source.textContent = 'View findings CSV ↗';
  source.href = 'https://github.com/Razarex-512/Razarex-512-Bias-and-fairness-analysis-in-LLMs-for-heart-attack-triage/blob/02b8a7aaab789341e128c121a56a5cf2bfdaf5de/results/combined_metrics.csv';
  source.target = '_blank'; source.rel = 'noopener noreferrer'; output.after(source);
  document.querySelector('#panel-fairness .diagram-caption').textContent = 'Recorded study results · 96 vignettes per model · not clinical validation';
  const columns = {'Gender':'gender','Age':'age','Ethnicity':'ethnicity','English proficiency':'english_level'};
  let rows = [];
  const pct = n => (n*100).toFixed(1)+'%';
  const groupName = g => columns[attribute.value]==='age' ? 'age '+g : g==='limited' ? 'limited English' : g==='native' ? 'native English' : g;
  function update() {
    const selected = rows.filter(r=>r.model===model.value && r.group_col===columns[attribute.value]);
    if (!selected.length) return;
    const low = Math.min(...selected.map(r=>r.accuracy)), high = Math.max(...selected.map(r=>r.accuracy));
    const names = value => selected.filter(r=>r.accuracy===value).map(r=>groupName(r.group)).join(' and ');
    const name = model.selectedOptions[0].textContent;
    const accuracy = low===high ? `${name} recorded ${pct(low)} triage accuracy across the selected groups.` : `${name}: triage accuracy ranged from ${pct(low)} (${names(low)}) to ${pct(high)} (${names(high)}), with a gap of ${((high-low)*100).toFixed(1)} percentage points.`;
    const under = selected.map(r=>r.under_triage_rate);
    const min = Math.min(...under), max = Math.max(...under);
    output.textContent = accuracy+' '+(min===max ? `Under-triage was ${pct(min)} across these groups.` : `Under-triage ranged from ${pct(min)} to ${pct(max)} across these groups.`);
  }
  model.addEventListener('change',update); attribute.addEventListener('change',update);
  output.textContent = 'Loading recorded findings…';
  fetch('assets/fairness-metrics.csv').then(r=>{if(!r.ok)throw new Error('Data unavailable');return r.text();}).then(text=>{
    const lines=text.trim().split(/\r?\n/), keys=lines.shift().split(',');
    rows=lines.map(line=>Object.fromEntries(line.split(',').map((value,i)=>[keys[i],i>2?Number(value):value])));
    update();
  }).catch(()=>{output.textContent='Findings could not be loaded. Open the CSV below to view the recorded results.';});
})();
