<div align="center">
  <img src="assets/img/logo.png" alt="Owltime" width="120">

  <h1>Owltime</h1>
  <p><strong>Mais organização para a rotina escolar.</strong></p>
  <p>Planeje horários, organize informações e acompanhe a distribuição das aulas em um só lugar.</p>
</div>

---

## Tudo o que a escola precisa para planejar melhor

O Owltime ajuda a reunir as principais informações da escola e transformá-las em uma grade de horários clara e organizada. Cadastros, demandas e disponibilidade ficam conectados para facilitar o planejamento do dia a dia.

## Conheça as funções

### 🏫 Organização escolar

Cadastre e consulte cursos, professores, disciplinas e turmas. Mantenha os dados importantes reunidos e fáceis de encontrar.

Nos cadastros de cursos, professores, disciplinas e turmas, baixe um modelo XLSX com listas suspensas ou um modelo CSV, preencha uma linha por registro e envie o arquivo para revisar a importação. Se a planilha tiver a coluna ID, IDs existentes atualizam os registros correspondentes; deixe o ID vazio para criar novos registros. IDs inexistentes ou repetidos na planilha são indicados como erro na prévia. O modelo XLSX de professores oferece titulação (Graduado(a), Especializado(a), Mestre, Doutor(a) e PHD), carga semanal (10, 20, 30 ou 40 aulas) e limite diário (1 a 12 aulas). O modelo de turmas oferece o ano anterior, atual e seguinte, além do semestre selecionado e dos dois semestres anteriores e seguintes. As listas de cursos do XLSX usam os cursos existentes no momento em que o modelo é baixado; por isso, baixe outro modelo se os cursos mudarem. CSV não suporta menus suspensos. O sistema valida os dados e as referências a cursos antes de importar; registros duplicados sem ID são ignorados. Disciplinas e turmas podem ser importadas em CSV ou XLSX.

Em todas as telas de cadastro, use **Baixar XLSX preenchido** para editar os registros existentes em lote ou acrescentar linhas novas. Preserve os IDs para atualizar os registros correspondentes; deixe o ID vazio para criar um novo. No cadastro de vínculos, nomes de professores com a área de ingresso anexada também são reconhecidos, professores compostos separados por `/` são associados individualmente quando cada nome puder ser identificado sem ambiguidade, e vínculos existentes sem ID são atualizados em vez de duplicados. Disciplinas ausentes no catálogo são criadas sem curso; associe-as ao curso correto depois da importação. Ao enviar o arquivo, revise a prévia antes de aplicar: se houver erros, todas as linhas problemáticas são mostradas e os registros válidos ainda podem ser importados sem elas. Linhas removidas da planilha não excluem registros do sistema.

No cadastro do professor, informe também a área ou disciplina de ingresso no concurso como texto livre; ela é independente dos vínculos de disciplinas por semestre e aparece junto ao nome do professor. A planilha de professores também deixa esse campo livre para preenchimento. Na tela de vínculos, selecione um curso para acompanhar as disciplinas demandadas pelas turmas desse curso e identificar professores sem vínculo com elas e disciplinas sem professor no semestre selecionado. Nas turmas, os períodos disponíveis são Matutino, Vespertino, Integral, Noturno e EAD.

Em **Grupos**, reúna turmas relacionadas (por exemplo, todas as turmas do 1º ano). No vínculo professor-disciplina, marque opcionalmente um ou mais grupos: durante a geração da grade, esse professor só será considerado nas turmas selecionadas. Vínculos sem grupo continuam gerais; turmas sem grupos seguem a distribuição normal. Se a disciplina tiver professor(es) vinculado(s) a um grupo que contém a turma, a grade prioriza esses professores para ela. Excluir uma turma a remove dos grupos; para excluir um grupo associado a vínculos, remova-o primeiro desses vínculos para não ampliar inadvertidamente o alcance dos professores.

### 🗓️ Planejamento de horários

Configure os horários da escola de segunda a domingo ou duplique os períodos e intervalos de um dia para outros dias. A página de horários apresenta um resumo semanal por dia, duração dos períodos, indicadores e alertas de sobreposição; a tabela também oferece filtros por dia, tipo e faixa de horário. Sábado e domingo são opcionais: só aparecem na grade e participam da geração quando há períodos de aula cadastrados nesses dias. No Painel, consulte PRDs e indisponibilidades do semestre. As opções dos menus suspensos são ordenadas alfabeticamente, mantendo instruções como “Selecione” no início. Cadastros com quadro de registros têm filtros avançados específicos por tela, combináveis com a busca textual, e um botão para limpar todos os filtros. Em demandas, por exemplo, a tabela mostra turma e curso e permite filtrar por curso, turma, semestre, disciplina e quantidade de aulas; o quadro também exibe a quantidade de registros e a soma das aulas semanais previstas, que acompanha os filtros. Cadastre demandas de uma turma por vez ou aplique a mesma disciplina e quantidade de aulas a várias turmas de uma vez; as disciplinas e as faixas de quantidade de aulas têm cores para facilitar a leitura.

Em **PRD e disponibilidade**, selecione semestre e curso para consultar os professores vinculados às disciplinas demandadas. Atribua ao professor um **Plano de Trabalho Docente (PRD)** em um dia da semana, destinado a atividades de ensino, pesquisa e extensão; o PRD bloqueia o dia inteiro na geração automática. O painel indica os professores com PRD e quem ainda não tem dia atribuído. Também é possível registrar indisponibilidades para o dia inteiro ou para horários de aula específicos do dia escolhido. PRDs que coincidam com aulas já presentes na grade precisam ser corrigidos antes de salvar.

### 📚 Grade escolar

Gere uma proposta de grade automaticamente pelo QDP e acompanhe todas as turmas ao mesmo tempo. O QDP é executado em segundo plano para manter a tela responsiva; enquanto ele calcula, aparece um indicador animado com o tempo decorrido, que some ao terminar ou se houver erro. Uma nova geração substitui a proposta atual sem uma confirmação intermediária e mostra por sete segundos um resumo das aulas previstas, preenchidas e pendentes por turma e disciplina. Na Grade oficial e em **Ajustes manuais**, combine os filtros de turma, disciplina, professor e situação da grade (todas, completas ou com pendências); a situação é calculada comparando as aulas alocadas com as demandas semanais de cada turma. Cada turma mostra apenas os períodos em que tem aulas alocadas. Em **Ajustes manuais**, os horários vazios continuam disponíveis para edição. O Painel mostra a data e o resumo da última geração. Quando precisar corrigir ou complementar o resultado, abra **Ajustes manuais**: arraste uma aula para outro horário vazio ou clique nela para editar/excluir. Também é possível clicar em um horário vazio para adicionar aula. O formulário mostra as demandas restantes e a disponibilidade e carga do professor. Avisos de demanda, indisponibilidade, conflito e limites são orientativos e podem ser confirmados. Na Grade oficial, a tabela **Carga dos professores** pode ser filtrada por professor, curso, turma, disciplina e situação (acima dos limites semanal ou diário, ou abaixo da carga declarada). Os filtros de curso, turma e disciplina selecionam docentes vinculados, mas a carga exibida considera todas as aulas de cada docente. A legenda de cores e disciplinas começa recolhida e pode ser aberta pelo botão **Mostrar cores e disciplinas**. **Gerar Declaração** exporta um PDF institucional com cursos, turmas, disciplinas, aulas semanais por professor e comparação com a carga semanal declarada no cadastro; informe o nome da instituição. Em **Vigências e substituições**, ao selecionar a turma o sistema filtra as disciplinas demandadas ou presentes na grade; ao escolher a disciplina, mostra os professores que estão com aulas atribuídas a ela, mantendo a lista geral de professores para escolher o substituto. Registre ou edite a substituição com início e fim opcionais. A grade-base não é alterada e as demais aulas são preservadas; no PDF, o professor vigente na data de emissão recebe essas aulas, e o histórico de substituições do semestre é exibido sem somar períodos distintos como carga simultânea. As alterações manuais de aulas continuam disponíveis em **Ajustes manuais**. Os dados das substituições são incluídos nos backups locais. Na Grade oficial, selecione uma turma ou professor para baixar um PDF individual formatado, compartilhá-lo como arquivo pelo menu nativo do dispositivo, baixar o CSV individual ou compartilhar/copiar um resumo. Selecione **Todas as turmas** para compartilhar diretamente um único PDF com as grades de todas as turmas, cada uma em sua página. Se o navegador não aceitar compartilhamento de arquivos, o PDF é baixado para ser anexado manualmente. O menu **Ajuda → Compartilhamento de horários** leva a esses recursos. O Owltime não hospeda links públicos; para publicar online, é necessário um serviço externo. Recolha o menu lateral pelo botão hambúrguer para ampliar a área de trabalho. As disciplinas recebem cores automáticas.

A visualização da grade — consolidada, por turma ou por disciplina — pode ser recolhida pelo botão **Recolher grade** e reaberta por **Expandir grade**, mantendo os filtros aplicados. O bloco **Carga dos professores**, incluindo seus filtros, também pode ser recolhido e reaberto pelo botão correspondente.

As listas de registros nas páginas de cadastro, PRD, anotações, vínculos, substituições, relatórios e armazenamento também podem ser recolhidas para liberar espaço. O conteúdo continua incluído na impressão.

Na declaração docente, carga atribuída igual à declarada aparece como correta; carga abaixo do declarado é listada como ajuste necessário, sem sinalização de erro; somente aulas acima da carga declarada são marcadas como divergência.

O QDP também considera como preferência, sem tornar obrigatório, agrupar as aulas de cada professor no mesmo dia e em períodos consecutivos, com preferência ainda maior por aproximar aulas da mesma disciplina, sempre respeitando as demandas e demais restrições. Em **Peculiaridades**, cadastre proteções específicas de cada turma (por exemplo, DEPAE ou PPS); na **Grade oficial**, dê duplo clique no período da turma e selecione a proteção. Em **Eventos**, cadastre marcações recorrentes que devem valer para todas as turmas compatíveis com o dia, horário e turno; basta aplicá-las uma vez com duplo clique na grade. Eventos são propagados às turmas correspondentes e a aplicação é recusada se houver aulas ou peculiaridades conflitantes, evitando bloqueios parciais. No módulo **Sort**, crie subgrupos próprios do sort, selecione as turmas de cada subgrupo e defina a quantidade e se os horários devem ser consecutivos. Antes de gerar a grade, use **Aplicar sort** na Grade oficial para sortear reservas aleatórias por turma. Dentro de cada subgrupo, nenhuma turma recebe o sort no mesmo período que outra; subgrupos diferentes podem coincidir. A aplicação só é permitida enquanto não houver aulas na grade e é cancelada por completo se não houver uma combinação válida para qualquer subgrupo. As reservas podem ser removidas pelo mesmo modal e são respeitadas pelo QDP. Proteções, eventos e sorts aparecem na grade, nos relatórios, PDFs e CSVs.

### 📊 Análises e relatórios

Na página **Relatórios**, escolha o semestre para consultar indicadores e o ranking com todos os professores, inclusive quem ainda não tem aulas. Filtre por curso, professor, turma, disciplina, busca textual ou quantidade mínima/máxima de aulas preenchidas. Ao selecionar um curso, o relatório considera suas turmas e o filtro de professor mostra quem tem aulas alocadas nelas; os indicadores, gráficos, ranking e resumo por turma refletem os filtros aplicados. O resumo por turma reúne aulas preenchidas e previstas, disciplinas e professores responsáveis. O relatório também lista as pendências da última geração, as quantidades previstas/alocadas e a causa diagnosticada pelo QDP; gere novamente a grade para obter causas nas gerações anteriores a esse diagnóstico. Use **Gerar PDF** para imprimir esse resumo em formato A4 ou exporte a grade do semestre em CSV.

### 📝 Anotações e backups

O bloco de notas organiza tarefas em um quadro de etapas (A fazer, Em andamento e Concluído), com prioridades, prazos, busca e alertas de vencimento. Exporte uma cópia dos seus dados e importe-a quando precisar restaurar suas informações.

## Comece por aqui

1. Abra **Ajuda** e clique em **Iniciar tutorial**. O guia acompanha a navegação, pode ser arrastado ou minimizado, traz instruções detalhadas e valores fictícios copiáveis em cada página e conduz do cadastro inicial à geração da grade.
2. Para os dados reais da escola, cadastre cursos, professores, disciplinas e turmas individualmente ou importe os modelos XLSX/CSV.
3. Configure horários, demandas, vínculos e PRDs/disponibilidades no mesmo semestre.
4. Gere a proposta pelo QDP, confira o resumo, faça ajustes se necessário e consulte os relatórios.
5. Gere os PDFs e mantenha cópias de backup em local seguro.

## Seus dados

O Owltime salva as informações neste navegador. Para não perder seus registros, use **Armazenamento e backup** e guarde uma cópia em um local seguro. Os dados não são sincronizados entre dispositivos.

O tutorial não possui uma base de teste isolada: qualquer exemplo salvo é adicionado aos dados deste navegador. Faça um backup antes de iniciar e restaure-o ao terminar para remover os cadastros de demonstração. O tutorial não cria nem exclui registros automaticamente.

---

<div align="center">
  <strong>Owltime</strong> · Sua rotina escolar, mais organizada. 🦉
</div>
