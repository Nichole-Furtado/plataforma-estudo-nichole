/**
 * Base de dados de módulos de estudo (in-memory).
 * Em produção, migrar para banco de dados (PostgreSQL, MongoDB, etc.)
 */
const modules = [
  {
    id: 'python-basics',
    title: '🐍 Python - Fundamentos',
    description: 'Aprenda os conceitos básicos de Python: variáveis, tipos de dados, operadores e entrada/saída.',
    language: 'python',
    icon: '🐍',
    order: 1,
    lessons: [
      {
        id: 'py-hello',
        title: 'Olá, Mundo!',
        description: 'Seu primeiro programa em Python.',
        content: `# Olá, Mundo em Python!

O comando **print()** é usado para exibir texto no console.

## Instruções
1. Execute o código abaixo para ver o resultado.
2. Modifique a mensagem para dizer "Olá, Nichole!".
3. Adicione um segundo print com outra mensagem.`,
        starterCode: `# Meu primeiro programa Python!
print("Olá, Mundo!")

# Dica: tente modificar a mensagem acima
# e adicionar mais prints abaixo
`,
        solution: `print("Olá, Nichole!")
print("Bem-vinda à Plataforma de Estudo!")`,
        hints: [
          'Use aspas dentro do print() para escrever texto.',
          'Cada print() exibe uma nova linha.',
        ],
      },
      {
        id: 'py-variables',
        title: 'Variáveis e Tipos',
        description: 'Aprenda sobre variáveis, strings, inteiros e floats.',
        content: `# Variáveis e Tipos de Dados

Em Python, você não precisa declarar o tipo de uma variável — ele é inferido automaticamente.

## Tipos principais:
- **str** → texto: \`"Olá"\`
- **int** → número inteiro: \`42\`
- **float** → número decimal: \`3.14\`
- **bool** → verdadeiro/falso: \`True\`, \`False\`

## Instruções
1. Crie variáveis para seu nome, idade e nota.
2. Use \`print()\` e \`type()\` para exibir os valores e tipos.`,
        starterCode: `# Crie suas variáveis aqui
nome = "Nichole"
idade = 25
nota = 9.5
esta_estudando = True

# Exiba os valores e tipos
print(f"Nome: {nome} - Tipo: {type(nome)}")
print(f"Idade: {idade} - Tipo: {type(idade)}")
print(f"Nota: {nota} - Tipo: {type(nota)}")
print(f"Estudando: {esta_estudando} - Tipo: {type(esta_estudando)}")
`,
        solution: `nome = "Nichole"
idade = 25
nota = 9.5
esta_estudando = True

print(f"Nome: {nome} - Tipo: {type(nome)}")
print(f"Idade: {idade} - Tipo: {type(idade)}")
print(f"Nota: {nota} - Tipo: {type(nota)}")
print(f"Estudando: {esta_estudando} - Tipo: {type(esta_estudando)}")`,
        hints: [
          'f-strings permitem inserir variáveis dentro de texto usando {variavel}.',
          'A função type() retorna o tipo de um valor.',
        ],
      },
      {
        id: 'py-conditionals',
        title: 'Condicionais (if/elif/else)',
        description: 'Tome decisões no código com estruturas condicionais.',
        content: `# Estruturas Condicionais

Use **if**, **elif** e **else** para executar código baseado em condições.

## Sintaxe
\`\`\`python
if condição:
    # código
elif outra_condição:
    # código
else:
    # código
\`\`\`

## Instruções
1. Complete o código para classificar a nota do aluno.
2. Teste com diferentes valores de nota.`,
        starterCode: `nota = 8.5

# Complete as condições abaixo:
if nota >= 9:
    conceito = "A - Excelente"
elif nota >= 7:
    conceito = "B - Bom"
elif nota >= 5:
    conceito = "C - Regular"
else:
    conceito = "D - Insuficiente"

print(f"Nota: {nota}")
print(f"Conceito: {conceito}")

# Desafio: adicione uma condição para nota = 10 
# com mensagem especial "Nota máxima! 🎉"
`,
        solution: `nota = 8.5

if nota == 10:
    conceito = "Nota máxima! 🎉"
elif nota >= 9:
    conceito = "A - Excelente"
elif nota >= 7:
    conceito = "B - Bom"
elif nota >= 5:
    conceito = "C - Regular"
else:
    conceito = "D - Insuficiente"

print(f"Nota: {nota}")
print(f"Conceito: {conceito}")`,
        hints: [
          'Use == para comparar igualdade (nota == 10).',
          'A ordem dos elif importa! Coloque condições mais específicas primeiro.',
        ],
      },
      {
        id: 'py-loops',
        title: 'Loops (for e while)',
        description: 'Repita ações com laços de repetição.',
        content: `# Loops em Python

## for loop
Usado para percorrer sequências (listas, strings, range).

## while loop
Repete enquanto uma condição for verdadeira.

## Instruções
1. Execute o código para ver os loops em ação.
2. Modifique para imprimir apenas os números pares de 1 a 20.`,
        starterCode: `# For loop com range
print("=== Contando de 1 a 5 ===")
for i in range(1, 6):
    print(f"Número: {i}")

print()

# For loop com lista
frutas = ["maçã", "banana", "uva", "manga"]
print("=== Lista de Frutas ===")
for fruta in frutas:
    print(f"🍎 {fruta}")

print()

# While loop
print("=== Countdown ===")
contador = 5
while contador > 0:
    print(f"  {contador}...")
    contador -= 1
print("🚀 Lançar!")

# Desafio: imprima os números pares de 1 a 20
`,
        solution: `print("=== Números Pares de 1 a 20 ===")
for i in range(1, 21):
    if i % 2 == 0:
        print(i)`,
        hints: [
          'Use range(1, 21) para gerar números de 1 a 20.',
          'O operador % (módulo) retorna o resto da divisão. Pares têm resto 0 quando divididos por 2.',
        ],
      },
      {
        id: 'py-functions',
        title: 'Funções',
        description: 'Crie blocos de código reutilizáveis com funções.',
        content: `# Funções em Python

Funções permitem organizar e reutilizar código.

## Sintaxe
\`\`\`python
def nome_funcao(parametros):
    # código
    return resultado
\`\`\`

## Instruções
1. Complete a função de cálculo de IMC.
2. Crie uma função que calcule a média de uma lista de números.`,
        starterCode: `# Função simples
def saudacao(nome):
    return f"Olá, {nome}! Bem-vinda à plataforma!"

print(saudacao("Nichole"))

# Complete a função de IMC
def calcular_imc(peso, altura):
    imc = peso / (altura ** 2)
    
    if imc < 18.5:
        categoria = "Abaixo do peso"
    elif imc < 25:
        categoria = "Peso normal"
    elif imc < 30:
        categoria = "Sobrepeso"
    else:
        categoria = "Obesidade"
    
    return imc, categoria

peso = 65
altura = 1.70
imc, categoria = calcular_imc(peso, altura)
print(f"IMC: {imc:.1f} - {categoria}")

# Desafio: crie uma função que calcule a média
def calcular_media(numeros):
    # Seu código aqui
    pass

# Teste sua função:
# notas = [8.5, 9.0, 7.5, 10.0, 8.0]
# print(f"Média: {calcular_media(notas)}")
`,
        solution: `def calcular_media(numeros):
    if len(numeros) == 0:
        return 0
    return sum(numeros) / len(numeros)

notas = [8.5, 9.0, 7.5, 10.0, 8.0]
print(f"Média: {calcular_media(notas)}")`,
        hints: [
          'Use sum() para somar todos os elementos e len() para contar.',
          'Não esqueça de tratar o caso de lista vazia para evitar divisão por zero.',
        ],
      },
    ],
  },
  {
    id: 'python-intermediate',
    title: '🐍 Python - Intermediário',
    description: 'Listas, dicionários, comprehensions, classes e manipulação de arquivos.',
    language: 'python',
    icon: '📊',
    order: 2,
    lessons: [
      {
        id: 'py-lists-dicts',
        title: 'Listas e Dicionários',
        description: 'Domine as estruturas de dados mais usadas em Python.',
        content: `# Listas e Dicionários

## Listas
Coleções ordenadas e mutáveis de elementos.

## Dicionários
Coleções de pares chave-valor.

## Instruções
1. Execute o código e observe os resultados.
2. Complete o desafio no final.`,
        starterCode: `# Listas
alunos = ["Ana", "Bruno", "Carla", "Diego"]
notas = [8.5, 9.0, 7.5, 10.0]

# Operações com listas
alunos.append("Nichole")
notas.append(9.5)
print(f"Alunos: {alunos}")
print(f"Melhor nota: {max(notas)}")
print(f"Média: {sum(notas)/len(notas):.1f}")

print()

# Dicionários
aluno = {
    "nome": "Nichole",
    "idade": 25,
    "curso": "Engenharia de Software",
    "notas": {"python": 9.5, "javascript": 8.0, "react": 9.0}
}

print(f"Aluna: {aluno['nome']}")
print(f"Curso: {aluno['curso']}")
print(f"Nota Python: {aluno['notas']['python']}")

# Desafio: crie um dicionário representando
# sua playlist com nome, artista e rating
`,
        solution: `playlist = {
    "musica1": {"nome": "Bohemian Rhapsody", "artista": "Queen", "rating": 5},
    "musica2": {"nome": "Imagine", "artista": "John Lennon", "rating": 4.5},
}
for key, musica in playlist.items():
    print(f"🎵 {musica['nome']} - {musica['artista']} ⭐{musica['rating']}")`,
        hints: [
          'Dicionários usam chaves {} e acessam valores com ["chave"].',
          'Use .items() para iterar sobre chave e valor de um dicionário.',
        ],
      },
      {
        id: 'py-comprehensions',
        title: 'List Comprehensions',
        description: 'Crie listas de forma elegante e concisa.',
        content: `# List Comprehensions

Forma compacta de criar listas a partir de iteráveis.

## Sintaxe
\`\`\`python
[expressão for item in iterável if condição]
\`\`\`

## Instruções
1. Pratique criando listas com comprehensions.
2. Compare com loops tradicionais.`,
        starterCode: `# Forma tradicional vs comprehension

# Tradicional
quadrados_trad = []
for n in range(1, 11):
    quadrados_trad.append(n ** 2)

# Comprehension (mesma coisa, mais elegante!)
quadrados = [n ** 2 for n in range(1, 11)]
print(f"Quadrados: {quadrados}")

# Com condição (filtrando)
pares = [n for n in range(1, 21) if n % 2 == 0]
print(f"Pares: {pares}")

# Com strings
nomes = ["ana", "bruno", "carla", "diego"]
capitalizados = [nome.capitalize() for nome in nomes]
print(f"Capitalizados: {capitalizados}")

# Dict comprehension
notas = [8.5, 9.0, 7.5, 10.0, 6.0]
classificacao = {f"Aluno {i+1}": "Aprovado" if n >= 7 else "Reprovado" 
                  for i, n in enumerate(notas)}
print(f"Classificação: {classificacao}")

# Desafio: use comprehension para criar lista 
# com o cubo dos números ímpares de 1 a 15
`,
        solution: `cubos_impares = [n ** 3 for n in range(1, 16) if n % 2 != 0]
print(f"Cubos dos ímpares: {cubos_impares}")`,
        hints: [
          'Ímpares: n % 2 != 0 (resto da divisão por 2 não é zero).',
          'Cubo: n ** 3 (n elevado à terceira potência).',
        ],
      },
    ],
  },
  {
    id: 'js-basics',
    title: '💛 JavaScript - Fundamentos',
    description: 'Aprenda os conceitos básicos de JavaScript: variáveis, funções e DOM.',
    language: 'javascript',
    icon: '💛',
    order: 3,
    lessons: [
      {
        id: 'js-hello',
        title: 'Olá, Mundo!',
        description: 'Seu primeiro programa em JavaScript.',
        content: `# Olá, Mundo em JavaScript!

**console.log()** é o equivalente ao print() do Python.

## Instruções
1. Execute o código abaixo.
2. Modifique para exibir seu nome.
3. Teste com template literals.`,
        starterCode: `// Meu primeiro programa JavaScript!
console.log("Olá, Mundo!");

// Template literals (backticks)
const nome = "Nichole";
console.log(\`Olá, \${nome}! Bem-vinda ao JavaScript!\`);

// Tipos de variáveis
const PI = 3.14159;        // constante (não muda)
let idade = 25;             // variável (pode mudar)
let estudando = true;       // boolean

console.log(\`PI: \${PI}\`);
console.log(\`Idade: \${idade}\`);
console.log(\`Estudando: \${estudando}\`);

// Operador typeof
console.log(\`Tipo de nome: \${typeof nome}\`);
console.log(\`Tipo de idade: \${typeof idade}\`);
`,
        solution: `const nome = "Nichole";
console.log(\`Olá, \${nome}! Bem-vinda ao JavaScript!\`);`,
        hints: [
          'Use const para valores que não mudam e let para valores que mudam.',
          'Template literals usam crase (`) e ${variavel} para interpolar.',
        ],
      },
      {
        id: 'js-functions',
        title: 'Funções e Arrow Functions',
        description: 'Diferentes formas de criar funções em JavaScript.',
        content: `# Funções em JavaScript

JavaScript tem várias formas de declarar funções.

## Instruções
1. Compare as diferentes sintaxes.
2. Crie sua própria arrow function.`,
        starterCode: `// Função tradicional
function saudacao(nome) {
    return \`Olá, \${nome}!\`;
}

// Arrow function
const saudacao2 = (nome) => \`Olá, \${nome}!\`;

console.log(saudacao("Nichole"));
console.log(saudacao2("Mundo"));

// Função com parâmetros padrão
const calcularDesconto = (preco, desconto = 0.10) => {
    const valorDesconto = preco * desconto;
    const precoFinal = preco - valorDesconto;
    return { preco, desconto: desconto * 100 + "%", valorDesconto, precoFinal };
};

console.log(calcularDesconto(100));
console.log(calcularDesconto(200, 0.25));

// Array methods com arrow functions
const numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const pares = numeros.filter(n => n % 2 === 0);
const dobros = numeros.map(n => n * 2);
const soma = numeros.reduce((acc, n) => acc + n, 0);

console.log(\`Pares: \${pares}\`);
console.log(\`Dobros: \${dobros}\`);
console.log(\`Soma: \${soma}\`);

// Desafio: crie uma arrow function que recebe um array
// e retorna a média dos valores
`,
        solution: `const calcularMedia = (arr) => arr.reduce((acc, n) => acc + n, 0) / arr.length;
const notas = [8.5, 9.0, 7.5, 10.0, 8.0]; 
console.log(\`Média: \${calcularMedia(notas)}\`);`,
        hints: [
          'Use reduce() para somar e length para contar os elementos.',
          'Arrow functions com uma expressão não precisam de return explícito.',
        ],
      },
    ],
  },
  {
    id: 'react-basics',
    title: '⚛️ React - Fundamentos',
    description: 'Aprenda os conceitos fundamentais de React: componentes, props, state e hooks.',
    language: 'javascript',
    icon: '⚛️',
    order: 4,
    lessons: [
      {
        id: 'react-intro',
        title: 'Introdução ao React',
        description: 'Entenda o que é React e como criar componentes.',
        content: `# Introdução ao React

React é uma biblioteca JavaScript para criar interfaces de usuário.

## Conceitos principais:
- **Componentes**: Blocos reutilizáveis de UI
- **JSX**: Sintaxe que mistura HTML com JavaScript
- **Props**: Dados passados de pai para filho
- **State**: Dados internos de um componente

## Nota
Como estamos na IDE de texto, os exemplos mostrarão a estrutura do código React.
Execute para ver a explicação detalhada no console.`,
        starterCode: `// Simulação de conceitos React no console
// (Na prática, React roda no navegador com JSX)

console.log("=== React - Conceitos Fundamentais ===\\n");

// 1. Componente como função
console.log("1. COMPONENTES");
console.log("   React usa funções para criar componentes:");
console.log("   function MeuComponente(props) { return <h1>{props.titulo}</h1> }\\n");

// 2. Props
console.log("2. PROPS (Propriedades)");
const Card = (props) => {
    return \`<Card titulo="\${props.titulo}" descricao="\${props.descricao}" />\`;
};
console.log("   " + Card({ titulo: "Python", descricao: "Aprenda Python" }));
console.log("   " + Card({ titulo: "React", descricao: "Aprenda React" }) + "\\n");

// 3. State (simulado)
console.log("3. STATE (Estado)");
let contador = 0;
const incrementar = () => ++contador;
incrementar(); incrementar(); incrementar();
console.log(\`   Contador: \${contador} (após 3 incrementos)\`);
console.log("   No React: const [count, setCount] = useState(0)\\n");

// 4. Hooks
console.log("4. HOOKS PRINCIPAIS");
console.log("   useState  → gerenciar estado");
console.log("   useEffect → efeitos colaterais");
console.log("   useRef    → referências mutáveis");
console.log("   useMemo   → memorização de valores");
`,
        solution: `console.log("Exemplo de componente React completo:");
console.log(\`
function TodoList() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  
  const addTodo = () => {
    setTodos([...todos, { text: input, done: false }]);
    setInput('');
  };
  
  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={addTodo}>Adicionar</button>
      <ul>
        {todos.map((todo, i) => (
          <li key={i}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}
\`);`,
        hints: [
          'Componentes React são funções que retornam JSX.',
          'useState retorna um array com [valor, funcaoParaAtualizar].',
        ],
      },
    ],
  },
];

module.exports = modules;
