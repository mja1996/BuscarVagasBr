class BuscaVagas {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.searchForm = document.getElementById('search-form');
        this.loadingDiv = document.getElementById('loading');
        this.categoryCards = document.querySelectorAll('.category-card');
    }

    bindEvents() {
        if (this.searchForm) {
            this.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        this.categoryCards.forEach(card => {
            card.addEventListener('click', () => this.selectCategory(card));
        });

        const categoriaSelect = document.getElementById('categoria');
        if (categoriaSelect) {
            categoriaSelect.addEventListener('change', (e) => this.loadSubcategorias(e.target.value));
        }
    }

    async handleSearch(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const searchData = {
            cargo: formData.get('cargo').trim(),
            categoria: formData.get('categoria'),
            localizacao: formData.get('localizacao').trim() || 'Brasil'
        };

        if (!searchData.cargo) {
            alert('Por favor, digite um cargo ou palavra-chave para buscar.');
            return;
        }

        const params = new URLSearchParams(searchData);
        window.location.href = `/resultados?${params.toString()}`;
    }

    selectCategory(card) {
        const category = card.dataset.category;
        const categoriaSelect = document.getElementById('categoria');

        if (categoriaSelect) {
            categoriaSelect.value = category;
            this.loadSubcategorias(category);
        }

        this.categoryCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
    }

    async loadSubcategorias(categoria) {
        if (!categoria) return;

        try {
            const response = await fetch(`/api/subcategorias/${categoria}`);
            const subcategorias = await response.json();
            console.log('Subcategorias carregadas:', subcategorias);
        } catch (error) {
            console.error('Erro ao carregar subcategorias:', error);
        }
    }

    showLoading() {
        if (this.loadingDiv) {
            this.loadingDiv.classList.remove('hidden');
        }
    }

    hideLoading() {
        if (this.loadingDiv) {
            this.loadingDiv.classList.add('hidden');
        }
    }
}

async function performSearch(searchData) {
    const loading = document.getElementById('loading');
    const jobResults = document.getElementById('job-results');
    const totalResults = document.getElementById('total-results');

    try {
        if (loading) loading.classList.remove('hidden');

        const response = await fetch('/api/buscar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchData)
        });

        const data = await response.json();

        if (data.success) {
            displayResults(data.vagas);
            if (totalResults) {
                const plural = data.total === 1 ? 'vaga encontrada' : 'vagas encontradas';
                totalResults.textContent = `${data.total} ${plural} para "${data.busca.cargo}"`;
            }
        } else {
            displayError(data.error || 'Erro na busca');
        }
    } catch (error) {
        console.error('Erro na busca:', error);
        displayError('Erro de conexão. Tente novamente.');
    } finally {
        if (loading) loading.classList.add('hidden');
    }
}

function displayResults(jobs) {
    const jobResults = document.getElementById('job-results');

    if (!jobs || jobs.length === 0) {
        jobResults.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Nenhuma vaga encontrada</h3>
                <p>Tente usar diferentes palavras-chave ou expandir sua busca para outras localidades.</p>
            </div>
        `;
        return;
    }

    const jobsHTML = jobs.map((job, index) => `
        <div class="job-card" style="animation-delay: ${index * 0.1}s">
            <div class="job-header">
                <div class="job-title">
                    <h3><a href="${job.link}" target="_blank" rel="noopener">${job.titulo}</a></h3>
                    <div class="job-company">${job.empresa}</div>
                </div>
                <div class="job-source">${job.fonte}</div>
            </div>

            <div class="job-details">
                <div class="job-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${job.localizacao}</span>
                </div>
                ${job.salario !== 'Salário não informado' ? `
                <div class="job-detail">
                    <i class="fas fa-dollar-sign"></i>
                    <span>${job.salario}</span>
                </div>
                ` : ''}
                <div class="job-detail">
                    <i class="fas fa-clock"></i>
                    <span class="job-date">${formatDate(job.data_scraped)}</span>
                </div>
            </div>

            <div class="job-description">
                ${job.descricao}
            </div>

            <div class="job-actions">
                <a href="${job.link}" target="_blank" rel="noopener" class="btn-apply">
                    <i class="fas fa-external-link-alt"></i>
                    Ver Vaga no ${job.fonte}
                </a>
            </div>
        </div>
    `).join('');

    jobResults.innerHTML = jobsHTML;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .job-card {
            animation: slideInUp 0.6s ease-out forwards;
            opacity: 0;
        }
    `;
    document.head.appendChild(style);
}

function displayError(message) {
    const jobResults = document.getElementById('job-results');
    jobResults.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erro na busca</h3>
            <p>${message}</p>
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return 'Hoje';
    } else if (diffDays === 2) {
        return 'Ontem';
    } else if (diffDays <= 7) {
        return `${diffDays - 1} dias atrás`;
    } else {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    new BuscaVagas();
    console.log('✅ BuscaVagas com Links Funcionais carregado!');
});

function fillSearch(term) {
    const cargoInput = document.getElementById('cargo');
    if (cargoInput) {
        cargoInput.value = term;
        cargoInput.focus();
    }
}
