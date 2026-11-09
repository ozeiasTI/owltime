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

Nos cadastros de cursos, professores, disciplinas e turmas, baixe um modelo XLSX com listas suspensas ou um modelo CSV, preencha uma linha por registro e envie o arquivo para revisar a importação. O modelo XLSX de professores oferece titulação (Graduado(a), Especializado(a), Mestre, Doutor(a) e PHD), carga semanal (10, 20, 30 ou 40 aulas) e limite diário (1 a 12 aulas). O modelo de turmas oferece o ano anterior, atual e seguinte, além do semestre selecionado e dos dois semestres anteriores e seguintes. As listas de cursos do XLSX usam os cursos existentes no momento em que o modelo é baixado; por isso, baixe outro modelo se os cursos mudarem. CSV não suporta menus suspensos. O sistema valida os dados e as referências a cursos antes de importar; registros duplicados são ignorados e os existentes não são substituídos. Disciplinas e turmas podem ser importadas em CSV ou XLSX.

Em todas as telas de cadastro, use **Baixar XLSX preenchido** para editar os registros existentes em lote ou acrescentar linhas novas. Preserve os IDs para atualizar os registros correspondentes; deixe o ID vazio para criar um novo. Ao enviar o arquivo, revise a prévia antes de aplicar. Linhas removidas da planilha não excluem registros do sistema.

No cadastro do professor, informe também a área ou disciplina de ingresso no concurso como texto livre; ela é independente dos vínculos de disciplinas por semestre e aparece junto ao nome do professor. A planilha de professores também deixa esse campo livre para preenchimento. Na tela de vínculos, selecione um curso para acompanhar as disciplinas demandadas pelas turmas desse curso e identificar professores sem vínculo com elas e disciplinas sem professor no semestre selecionado. Nas turmas, os períodos disponíveis são Matutino, Vespertino, Integral, Noturno e EAD.

### 🗓️ Planejamento de horários

Configure os horários da escola de segunda a domingo ou duplique os períodos e intervalos de um dia para outros dias. A página de horários apresenta um resumo semanal por dia, duração dos períodos, indicadores e alertas de sobreposição; a tabela também oferece filtros por dia, tipo e faixa de horário. Sábado e domingo são opcionais: só aparecem na grade e participam da geração quando há períodos de aula cadastrados nesses dias. No Painel, consulte PRDs e indisponibilidades do semestre. As opções dos menus suspensos são ordenadas alfabeticamente, mantendo instruções como “Selecione” no início. Cadastros com quadro de registros têm filtros avançados específicos por tela, combináveis com a busca textual, e um botão para limpar todos os filtros. Em demandas, por exemplo, a tabela mostra turma e curso e permite filtrar por curso, turma, semestre, disciplina e quantidade de aulas; o quadro também exibe a quantidade de registros e a soma das aulas semanais previstas, que acompanha os filtros. Cadastre demandas de uma turma por vez ou aplique a mesma disciplina e quantidade de aulas a várias turmas de uma vez; as disciplinas e as faixas de quantidade de aulas têm cores para facilitar a leitura.

Em **PRD e disponibilidade**, selecione semestre e curso para consultar os professores vinculados às disciplinas demandadas. Atribua ao professor um **Plano de Trabalho Docente (PRD)** em um dia da semana, destinado a atividades de ensino, pesquisa e extensão; o PRD bloqueia o dia inteiro na geração automática. O painel indica os professores com PRD e quem ainda não tem dia atribuído. Também é possível registrar indisponibilidades para o dia inteiro ou para horários de aula específicos do dia escolhido. PRDs que coincidam com aulas já presentes na grade precisam ser corrigidos antes de salvar.

### 📚 Grade escolar

Gere uma proposta de grade automaticamente pelo QDP e acompanhe todas as turmas ao mesmo tempo. O QDP é executado em segundo plano para manter a tela responsiva; enquanto ele calcula, aparece um indicador animado com o tempo decorrido, que some ao terminar ou se houver erro. Uma nova geração substitui a proposta atual sem uma confirmação intermediária e mostra por sete segundos um resumo das aulas previstas, preenchidas e pendentes por turma e disciplina. Na Grade oficial e em **Ajustes manuais**, combine os filtros de turma, disciplina, professor e situação da grade (todas, completas ou com pendências); a situação é calculada comparando as aulas alocadas com as demandas semanais de cada turma. Cada turma mostra apenas os períodos em que tem aulas alocadas. Em **Ajustes manuais**, os horários vazios continuam disponíveis para edição. O Painel mostra a data e o resumo da última geração. Quando precisar corrigir ou complementar o resultado, abra **Ajustes manuais**: arraste uma aula para outro horário vazio ou clique nela para editar/excluir. Também é possível clicar em um horário vazio para adicionar aula. O formulário mostra as demandas restantes e a disponibilidade e carga do professor. Avisos de demanda, indisponibilidade, conflito e limites são orientativos e podem ser confirmados. Na Grade oficial, **Gerar Declaração** exporta um PDF institucional com cursos, turmas, disciplinas, aulas semanais por professor e comparação com a carga semanal declarada no cadastro; informe o nome da instituição. Em **Vigências e substituições**, ao selecionar a turma o sistema filtra as disciplinas demandadas ou presentes na grade; ao escolher a disciplina, mostra os professores que estão com aulas atribuídas a ela, mantendo a lista geral de professores para escolher o substituto. Registre ou edite a substituição com início e fim opcionais. A grade-base não é alterada e as demais aulas são preservadas; no PDF, o professor vigente na data de emissão recebe essas aulas, e o histórico de substituições do semestre é exibido sem somar períodos distintos como carga simultânea. As alterações manuais de aulas continuam disponíveis em **Ajustes manuais**. Os dados das substituições são incluídos nos backups locais. Na Grade oficial, selecione uma turma ou professor para baixar um PDF individual formatado, compartilhá-lo como arquivo pelo menu nativo do dispositivo, baixar o CSV individual ou compartilhar/copiar um resumo. Selecione **Todas as turmas** para compartilhar diretamente um único PDF com as grades de todas as turmas, cada uma em sua página. Se o navegador não aceitar compartilhamento de arquivos, o PDF é baixado para ser anexado manualmente. O menu **Ajuda → Compartilhamento de horários** leva a esses recursos. O Owltime não hospeda links públicos; para publicar online, é necessário um serviço externo. Recolha o menu lateral pelo botão hambúrguer para ampliar a área de trabalho. As disciplinas recebem cores automáticas.

A visualização **Grade de todas as turmas** pode ser recolhida pelo botão **Recolher grade** e reaberta por **Expandir grade**, mantendo os filtros aplicados.

Na declaração docente, carga atribuída igual à declarada aparece como correta; carga abaixo do declarado é listada como ajuste necessário, sem sinalização de erro; somente aulas acima da carga declarada são marcadas como divergência.

### 📊 Análises e relatórios

Na página **Relatórios**, escolha o semestre para consultar indicadores e o ranking com todos os professores, inclusive quem ainda não tem aulas. Filtre por curso, professor, turma, disciplina, busca textual ou quantidade mínima/máxima de aulas preenchidas. Ao selecionar um curso, o relatório considera suas turmas e o filtro de professor mostra quem tem aulas alocadas nelas; os indicadores, gráficos, ranking e resumo por turma refletem os filtros aplicados. O resumo por turma reúne aulas preenchidas e previstas, disciplinas e professores responsáveis. Use **Gerar PDF** para imprimir esse resumo em formato A4 ou exporte a grade do semestre em CSV.

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
