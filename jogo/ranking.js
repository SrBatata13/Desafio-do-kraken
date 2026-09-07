import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://okanxeevvhnmtxlnwlol.supabase.co';
const supabaseKey = 'sb_publishable_aa0b-bcFDprV_NCnKRjcUA_lcquntDY';

export const supabase = createClient(
    supabaseUrl,
    supabaseKey
);

        const equipesConfig = {

            1: {
                classe: 'bandeira-time-1',
                brasao: '../assets/brasao_caveira.png'
            },

            2: {
                classe: 'bandeira-time-2',
                brasao: '../assets/brasao_holandes.png'
            },

            3: {
                classe: 'bandeira-time-3',
                brasao: '../assets/brasao_maldição.png'
            },

            4: {
                classe: 'bandeira-time-4',
                brasao: '../assets/brasao_perola.png'
            }

        };

        const posicoes = [
            ...document.querySelectorAll('.posicao')
        ];

        const brasaoJogador =
            document.getElementById('brasaoJogador');

        const nomeEquipeJogador =
            document.getElementById('nomeEquipeJogador');

        const pontuacaoJogador =
            document.getElementById('pontuacao');

        const equipeJogadorId =
            Number(
                localStorage.getItem('equipe_id')
            );

    async function carregarRanking() {

            const {
                data: equipes,
                error
            } = await supabase
                .from('equipes')
                .select('id, nome, pontuacao')
                .order(
                    'pontuacao',
                    {
                        ascending: false
                    }
                )
                .order(
                    'id',
                    {
                        ascending: true
                    }
                );


            if (error) {

                console.error(
                    'Erro ao carregar ranking:',
                    error
                );

                return;
            }


            if (!equipes || equipes.length === 0) {

                console.warn(
                    'Nenhuma equipe encontrada.'
                );

                return;
            }


            console.log(
                '🏆 Ranking:',
                equipes
            );


            atualizarRanking(equipes);

            atualizarMenuJogador(equipes);

        }

function atualizarRanking(equipes) {

    posicoes.forEach(
        (posicao, indice) => {

            const equipe =
                equipes[indice];


            if (!equipe) {
                return;
            }


            const configuracao =
                equipesConfig[equipe.id];


            if (!configuracao) {

                console.warn(
                    `Equipe ${equipe.id} não possui configuração.`
                );

                return;
            }

            const bandeira =
                posicao.querySelector('.bandeira');


            const pontos =
                posicao.querySelector('.pontos');


            bandeira.className =
                `bandeira ${configuracao.classe}`;


            // --------------------------------------
            // MOSTRAR PONTUAÇÃO
            // --------------------------------------

            pontos.textContent =
                equipe.pontuacao;


            // --------------------------------------
            // NOME PARA DEBUG
            // --------------------------------------

            posicao.dataset.equipeId =
                equipe.id;

            posicao.title =
                equipe.nome;

        }
    );

}

function atualizarMenuJogador(equipes) {

    if (!equipeJogadorId) {

        return;
    }


    const equipe =
        equipes.find(
            equipe =>
                Number(equipe.id) ===
                equipeJogadorId
        );


    if (!equipe) {

        console.warn(
            'Equipe do jogador não encontrada.'
        );

        return;
    }


    const configuracao =
        equipesConfig[equipe.id];


    if (!configuracao) {

        return;
    }

    if (brasaoJogador) {

        brasaoJogador.src =
            configuracao.brasao;

        brasaoJogador.alt =
            `Brasão ${equipe.nome}`;

    }

    if (nomeEquipeJogador) {

        nomeEquipeJogador.textContent =
            equipe.nome;

    }

    if (pontuacaoJogador) {

        pontuacaoJogador.textContent =
            `${equipe.pontuacao} moedas`;

    }

}

let intervaloRanking = null;

function iniciarAtualizacaoRanking() {

    carregarRanking();


    intervaloRanking =
        setInterval(
            carregarRanking,
            2000
        );

}

iniciarAtualizacaoRanking();