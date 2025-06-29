document.addEventListener('DOMContentLoaded', () => {
    
    let knowledgeBase = null;
    const analyzeButton = document.getElementById('analyze-button');
    const resultContainer = document.getElementById('result-container');
    const toggleReportButton = document.getElementById('toggle-report-button');
    const reportContainer = document.getElementById('report-container');
    
    // --- 1. 加载数据 ---
    fetch('knowledge_base.json')
        .then(response => response.json())
        .then(data => {
            knowledgeBase = data;
            console.log('知识库与统计报告已成功加载！');
            // 数据加载后，渲染统计报告
            renderReport(data.statistics);
        })
        .catch(error => {
            console.error('加载知识库失败:', error);
            resultContainer.style.display = 'block';
            resultContainer.innerHTML = '<h3>错误</h3><p>加载知识库文件(knowledge_base.json)失败，请确保它与HTML文件在同一目录下。</p>';
        });

    // --- 2. 绑定事件 ---
    analyzeButton.addEventListener('click', performAnalysis);
    toggleReportButton.addEventListener('click', () => {
        reportContainer.classList.toggle('hidden');
    });

    // --- 3. 渲染统计报告的函数 ---
    function renderReport(stats) {
        let html = `<h2>历史数据分析报告</h2>`;

        // 基础概览
        html += `
            <div class="report-section">
                <h3>1. 基础数据概览</h3>
                <div class="stats-grid">
                    <div class="stat-card"><span class="stat-card-title">总数据期数</span><span class="stat-card-value">${stats.overview.total_periods}</span></div>
                    <div class="stat-card"><span class="stat-card-title">总中奖次数</span><span class="stat-card-value">${stats.overview.num_wins}</span></div>
                    <div class="stat-card"><span class="stat-card-title">总未中奖次数</span><span class="stat-card-value">${stats.overview.num_losses}</span></div>
                    <div class="stat-card"><span class="stat-card-title">总体中奖率</span><span class="stat-card-value">${(stats.overview.win_rate * 100).toFixed(2)}<small>%</small></span></div>
                </div>
            </div>`;
        
        // 赔率分析
        html += `
            <div class="report-section">
                <h3>2. 赔率统计分析</h3>
                <h4>全部数据</h4>
                <div class="stats-grid">
                    <div class="stat-card"><span class="stat-card-title">平均赔率</span><span class="stat-card-value">${stats.odds.all.mean.toFixed(2)}</span></div>
                    <div class="stat-card"><span class="stat-card-title">最高赔率</span><span class="stat-card-value">${stats.odds.all.max.toFixed(2)}</span></div>
                    <div class="stat-card"><span class="stat-card-title">最低赔率</span><span class="stat-card-value">${stats.odds.all.min.toFixed(2)}</span></div>
                </div>
                 <h4>中奖时</h4>
                <div class="stats-grid">
                    <div class="stat-card"><span class="stat-card-title">平均赔率</span><span class="stat-card-value">${stats.odds.win.mean.toFixed(2)}</span></div>
                    <div class="stat-card"><span class="stat-card-title">最高赔率</span><span class="stat-card-value">${stats.odds.win.max.toFixed(2)}</span></div>
                    <div class="stat-card"><span class="stat-card-title">最低赔率</span><span class="stat-card-value">${stats.odds.win.min.toFixed(2)}</span></div>
                </div>
            </div>`;

        // 连黑/连红分析
        html += `
            <div class="report-section">
                <h3>3. 连黑 / 连红 分析</h3>
                 <h4>连黑分析</h4>
                <div class="stats-grid">
                    <div class="stat-card"><span class="stat-card-title">最长连黑</span><span class="stat-card-value">${stats.streaks.losing.max}</span></div>
                    <div class="stat-card"><span class="stat-card-title">平均连黑</span><span class="stat-card-value">${stats.streaks.losing.mean.toFixed(2)}</span></div>
                </div>
                <h4>连红分析</h4>
                <div class="stats-grid">
                    <div class="stat-card"><span class="stat-card-title">最长连红</span><span class="stat-card-value">${stats.streaks.winning.max}</span></div>
                    <div class="stat-card"><span class="stat-card-title">平均连红</span><span class="stat-card-value">${stats.streaks.winning.mean.toFixed(2)}</span></div>
                </div>
                <h4>连黑次数分布图</h4>
                <canvas id="losingStreakChart"></canvas>
            </div>`;

        // 序列关联和期望值
        html += `
            <div class="report-section">
                <h3>4. 核心概率与期望值</h3>
                 <div class="stats-grid">
                    <div class="stat-card"><span class="stat-card-title">黑转红概率</span><span class="stat-card-value">${(stats.sequence.prob_win_after_loss * 100).toFixed(2)}<small>%</small></span></div>
                    <div class="stat-card"><span class="stat-card-title">红转红概率</span><span class="stat-card-value">${(stats.sequence.prob_win_after_win * 100).toFixed(2)}<small>%</small></span></div>
                    <div class="stat-card"><span class="stat-card-title">基础数学期望</span><span class="stat-card-value">${stats.ev.ev_per_bet.toFixed(4)}</span></div>
                </div>
            </div>`;

        reportContainer.innerHTML = html;

        // 渲染图表
        renderCharts(stats);
    }
    
    // --- 4. 渲染图表的函数 ---
    function renderCharts(stats) {
        const streakCtx = document.getElementById('losingStreakChart').getContext('2d');
        new Chart(streakCtx, {
            type: 'bar',
            data: {
                labels: stats.streaks.losing_dist.lengths,
                datasets: [{
                    label: '连黑长度发生频率',
                    data: stats.streaks.losing_dist.counts,
                    backgroundColor: 'rgba(231, 76, 60, 0.6)',
                    borderColor: 'rgba(192, 57, 43, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: '发生次数' } },
                    x: { title: { display: true, text: '连黑长度' } }
                }
            }
        });
    }

    // --- 5. 策略分析函数 (与之前版本相同) ---
    function performAnalysis() {
        if (!knowledgeBase) {
            alert('知识库尚未加载完成，请稍候...');
            return;
        }
        // ... (此处省略与之前版本完全相同的策略分析逻辑)
         const currentStreak = parseInt(document.getElementById('streak-input').value);
        const todayOdds = parseFloat(document.getElementById('odds-input').value);

        if (isNaN(currentStreak) || currentStreak < 0) { alert('请输入有效的“连黑次数”！'); return; }
        if (isNaN(todayOdds) || todayOdds <= 1) { alert('请输入有效的“赔率”（必须大于1）！'); return; }

        const { knowledge_base, bin_edges, bin_names, global_win_rate } = knowledgeBase;

        let todayOddsBinId = bin_edges.findIndex((edge, index) => index < bin_edges.length - 1 && todayOdds >= edge && todayOdds < bin_edges[index + 1]);
        if (todayOdds === bin_edges[bin_edges.length - 1]) { todayOddsBinId = bin_edges.length - 2; }
        if (todayOddsBinId === -1) { todayOddsBinId = bin_names.length -1; }
        todayOddsBinId += 1;

        const compositeKey = `k${currentStreak}_${todayOddsBinId}`;
        
        let resultHTML = `<h3>分析结果</h3>`;
        resultHTML += `<p><b>今日情景:</b> (一次中奖后)已连黑 ${currentStreak} 次，今日赔率 ${todayOdds.toFixed(2)} (自动落入 ${bin_names[todayOddsBinId - 1]} 区间)。</p>`;

        let expectedWinRate;
        if (knowledge_base[compositeKey]) {
            const outcomes = knowledge_base[compositeKey];
            const totalOccurrences = outcomes.length;
            const winsAfter = outcomes.filter(res => res === 1).length;
            expectedWinRate = winsAfter / totalOccurrences;
            
            resultHTML += `<p><b>【精准匹配】</b>历史统计: 此完全相同情景共出现 ${totalOccurrences} 次。</p>`;
            resultHTML += `<p><b>胜率期望:</b> 在这 ${totalOccurrences} 次之后，下一次的中奖概率为: <b>${(expectedWinRate * 100).toFixed(2)}%</b>。</p>`;
        } else {
            expectedWinRate = global_win_rate;
            resultHTML += `<p><b>【无精准匹配】</b>历史上从未出现过此“连黑-赔率”组合。</p>`;
            resultHTML += `<p><b>胜率期望:</b> 无法提供精准胜率，将使用全局平均胜率 <b>${(expectedWinRate * 100).toFixed(2)}%</b> 作为最保守的估计。</p>`;
        }
        
        const evPerBet = expectedWinRate * (todayOdds - 1) - (1 - expectedWinRate) * 1;
        resultHTML += `<p><b>策略期望:</b> 基于此胜率和赔率，今日出手的基础数学期望值(EV)为: <b>${evPerBet.toFixed(4)}</b>。</p>`;
        
        resultHTML += `<h3>策略建议</h3>`;
        if (evPerBet > 0.2) { resultHTML += `<p class="rating star5">【评级】: ★★★★★ (强烈推荐 | 进攻型)</p>`; }
        else if (evPerBet > 0.05) { resultHTML += `<p class="rating star4">【评级】: ★★★★☆ (机会良好 | 标准型)</p>`; }
        else if (evPerBet >= -0.1) { resultHTML += `<p class="rating star3">【评级】: ★★★☆☆ (谨慎观望 | 防御型)</p>`; }
        else { resultHTML += `<p class="rating star1">【评级】: ★☆☆☆☆ (规避风险 | 离场)</p>`; }

        resultContainer.innerHTML = resultHTML;
        resultContainer.classList.remove('hidden');
    }
});