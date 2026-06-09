const store = require('./store');
const seedModules = require('./data/modules');

/**
 * Estado da aplicação mantido em memória (para leituras rápidas) e
 * persistido via store (MongoDB ou arquivos) a cada alteração.
 *
 * As rotas devem SEMPRE acessar via `state.<chave>` (acesso dinâmico),
 * pois `init()` substitui as referências ao carregar do banco.
 */
const state = {
  modules: [],
  progress: {},
  tracker: {},
  financeiro: {},
};

async function init() {
  await store.connect();

  // Módulos: usa o que estiver salvo; na 1ª vez, semeia com o conteúdo padrão.
  const storedModules = await store.load('modules', null);
  if (storedModules) {
    state.modules = storedModules;
  } else {
    state.modules = JSON.parse(JSON.stringify(seedModules));
    await store.save('modules', state.modules);
  }

  state.progress = await store.load('progress', {});
  state.tracker = await store.load('tracker', {});
  state.financeiro = await store.load('financeiro', {});

  console.log(`✅ Dados carregados (${state.modules.length} módulos)`);
}

/** Persiste uma chave do estado (write-through). */
function persist(key) {
  return store.save(key, state[key]);
}

module.exports = { state, init, persist };
