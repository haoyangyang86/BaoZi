// 等待文档加载完成
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. 定义全局变量并加载数据 ---
    let knowledgeBase = null;
    const analyzeButton = document.getElementById('analyze-button');
    const resultContainer = document.getElementById('result-container');
    
    // 使用 fetch API 异步加载JSON数据
    fetch('knowledge_base.json')
        .then(response => response.json())
        .then(data => {
            knowledgeBase = data;
            console.log('知识库已成功加载！');
        })
        .catch(error => {
            console.error('加载知识库失败:', error);
            resultContainer.style.display = 'block';
            resultContainer.innerHTML = '<h3>错误</h3><p>加载知识库文件(knowledge_base.json)失败，请确保它与HTML文件在同一目录下。</p>';
        });

    // --- 2. 绑定按钮点击事件 ---
    analyzeButton.addEventListener('click', () => {
        if (!knowledgeBase) {
            alert('知识库尚未加载完成，请稍候...');
            return;
        }

        // --- 获取用户输入 ---
        const currentStreak = parseInt(document.getElementById('streak-input').value);
        const todayOdds = parseFloat(document.getElementById('odds-input').value);

        // --- 输入验证 ---
        if (isNaN(currentStreak) || currentStreak < 0) {
            alert('请输入有效的“连黑次数”！');
            return;
        }
        if (isNaN(todayOdds) || todayOdds <= 1) {
            alert('请输入有效的“赔率”（必须大于1）！');
            return;
        }

        // --- 开始分析 ---
        performAnalysis(currentStreak, todayOdds);
    });

    // --- 3. 核心分析函数 ---
    function performAnalysis(currentStreak, todayOdds) {
        const { knowledge_base, bin_edges, bin_names, global_win_rate } = knowledgeBase;

        // 找到赔率区间ID
        let todayOddsBinId = bin_edges.findIndex((edge, index) => {
            if (index < bin_edges.length - 1) {
                return todayOdds >= edge && todayOdds < bin_edges[index + 1];
            }
            return false;
        });
        // 特殊处理最大值和边界情况
        if (todayOdds === bin_edges[bin_edges.length - 1]) {
            todayOddsBinId = bin_edges.length - 2;
        }
        if (todayOddsBinId === -1) { // 如果没找到（例如超出范围），归为最后一个
             todayOddsBinId = bin_names.length -1;
        }
        todayOddsBinId += 1; // JS index从0开始，MATLAB从1开始，对齐

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
            resultHTML += `<p><b>胜率期望:</b> 无法提供精准胜率，将使用全局平均胜率 <b>${(expectedWinrate * 100).toFixed(2)}%</b> 作为最保守的估计。</p>`;
        }
        
        const evPerBet = expectedWinRate * (todayOdds - 1) - (1 - expectedWinRate) * 1;
        resultHTML += `<p><b>策略期望:</b> 基于此胜率和赔率，今日出手的基础数学期望值(EV)为: <b>${evPerBet.toFixed(4)}</b>。</p>`;
        
        // 生成建议
        resultHTML += `<h3>策略建议</h3>`;
        if (evPerBet > 0.2) {
            resultHTML += `<p class="rating star5">【评级】: ★★★★★ (强烈推荐 | 进攻型)</p>`;
        } else if (evPerBet > 0.05) {
            resultHTML += `<p class="rating star4">【评级】: ★★★★☆ (机会良好 | 标准型)</p>`;
        } else if (evPerBet >= -0.1) {
            resultHTML += `<p class="rating star3">【评级】: ★★★☆☆ (谨慎观望 | 防御型)</p>`;
        } else {
            resultHTML += `<p class="rating star1">【评级】: ★☆☆☆☆ (规避风险 | 离场)</p>`;
        }

        resultContainer.innerHTML = resultHTML;
        resultContainer.style.display = 'block';
    }
});