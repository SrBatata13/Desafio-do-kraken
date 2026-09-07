import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://okanxeevvhnmtxlnwlol.supabase.co';
const supabaseKey = 'sb_publishable_aa0b-bcFDprV_NCnKRjcUA_lcquntDY';

export const supabase = createClient(
    supabaseUrl,
    supabaseKey
);

const nomeVencedor = document.getElementById('nomeVencedor');
const brasaoVencedor = document.getElementById('brasaoVencedor');
const pontuacaoVencedor = document.getElementById('pontuacaoVencedor');
const jogadoresVencedores = document.getElementById('jogadoresVencedores');

const brasoes = {
    1: '../assets/brasao_caveira.png',
    2: '../assets/brasao_holandes.png',
    3: '../assets/brasao_maldição.png',
    4: '../assets/brasao_perola.png'
};

async function carregarVencedor() {

    const { data: equipes, error } = await supabase
        .from('equipes')
        .select('id, nome, pontuacao')
        .order('pontuacao', { ascending: false })
        .order('id', { ascending: true });

    if (error) {
        console.error('Erro ao carregar equipes:', error);
        return;
    }

    if (!equipes || equipes.length === 0) {
        console.error('Nenhuma equipe encontrada.');
        return;
    }

    const vencedor = equipes[0];

    console.log('Equipe vencedora:', vencedor);

    // Nome
    nomeVencedor.textContent = vencedor.nome;

    // Pontuação
    pontuacaoVencedor.textContent = `${vencedor.pontuacao} moedas`;

    // Brasão
    if (brasoes[vencedor.id]) {
        brasaoVencedor.src = brasoes[vencedor.id];
    }

    // Carrega jogadores
    await carregarJogadores(vencedor.id);
}

async function carregarJogadores(equipeId) {

    const { data: jogadores, error } = await supabase
        .from('jogadores')
        .select('id, nome, foto_url')
        .eq('equipe_id', equipeId)
        .order('nome', { ascending: true });

    if (error) {
        console.error('Erro ao carregar jogadores:', error);
        return;
    }

    jogadoresVencedores.innerHTML = '';

    jogadores.forEach(jogador => {

        const jogadorDiv = document.createElement('div');

        jogadorDiv.classList.add('jogador-vencedor');

        jogadorDiv.innerHTML = `
            <img
                src="${jogador.foto_url}"
                alt="${jogador.nome}"
            >

            <h2>${jogador.nome}</h2>
        `;

        jogadoresVencedores.appendChild(jogadorDiv);
    });
}

carregarVencedor();