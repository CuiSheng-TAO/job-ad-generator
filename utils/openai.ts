import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY || '',
    baseURL: 'https://api.siliconflow.cn/v1/',
    dangerouslyAllowBrowser: true,
});

const MODEL = 'Pro/MiniMaxAI/MiniMax-M2.5';

export interface JDFormData {
    jobTitle: string;
    industry: string;
    companyProfile: string;
    keyWords: string;
    painPoints: string;
    teamStatus: string;
    referenceCompanies: string;
}

export interface GenerationStep {
    id: 'analysis' | 'benchmark' | 'reasoning' | 'output';
    title: string;
    content: string;
}

type OnStepUpdate = (step: GenerationStep) => void;

async function callLLM(messages: { role: 'system' | 'user'; content: string }[]): Promise<string> {
    const completion = await openai.chat.completions.create({
        messages,
        model: MODEL,
    });
    return completion.choices[0].message.content || '';
}

function buildContext(data: JDFormData): string {
    let ctx = `职位名称：${data.jobTitle}\n所属行业/公司：${data.industry}`;
    if (data.companyProfile) ctx += `\n公司简介：${data.companyProfile}`;
    if (data.keyWords) ctx += `\n核心技能/关键词：${data.keyWords}`;
    if (data.painPoints) ctx += `\n业务痛点/招聘背景：${data.painPoints}`;
    if (data.teamStatus) ctx += `\n团队现状：${data.teamStatus}`;
    if (data.referenceCompanies) ctx += `\n参考对标公司：${data.referenceCompanies}`;
    return ctx;
}

// Step 1: 需求分析
async function stepAnalysis(data: JDFormData): Promise<string> {
    const context = buildContext(data);
    const prompt = `你是一位资深的人力资源专家和组织发展顾问。

请基于以下招聘信息，进行深入的岗位需求分析：

${context}

请从以下几个维度进行分析（直接输出分析内容，不要输出多余的开场白）：
1. **岗位本质**：这个岗位的核心价值是什么？它在组织中解决什么根本问题？
2. **能力模型**：胜任这个岗位需要哪些核心能力？哪些是硬性要求，哪些是软性素质？
3. **人才画像**：适合这个岗位的人可能来自什么背景？他们的典型职业路径是什么？
${data.painPoints ? '4. **痛点映射**：当前业务痛点如何直接映射到岗位职责？这个人需要优先解决什么问题？' : ''}
${data.teamStatus ? '5. **团队补位**：基于团队现状，这个岗位需要补充什么能力缺口？' : ''}

请输出结构化的分析结果，语言精炼专业。`;

    return callLLM([{ role: 'user', content: prompt }]);
}

// Step 2: 行业对标
async function stepBenchmark(data: JDFormData, analysis: string): Promise<string> {
    const prompt = `你是一位资深的人力资源专家，对各大科技公司和行业头部企业的岗位设置非常了解。

基于以下岗位需求分析：
${analysis}

职位：${data.jobTitle}
行业：${data.industry}
${data.referenceCompanies ? `用户指定的参考公司：${data.referenceCompanies}` : ''}

请进行行业对标分析（直接输出分析内容，不要输出多余的开场白）：
1. **行业标杆岗位**：在行业内头部公司${data.referenceCompanies ? `（尤其是${data.referenceCompanies}）` : ''}，类似职能通常对应什么岗位？这些岗位的核心职责是什么？
2. **共性特征提炼**：这些标杆岗位有什么共同特征？可以归纳出什么稳定的人才画像？
3. **本土化映射**：在国内岗位体系中，能够最直接承接上述职能逻辑的岗位定位是什么？
4. **差异化建议**：基于当前公司的具体情况，这个岗位的设计应该与标杆有哪些差异化调整？

请输出结构化的对标分析，给出具体的岗位参考和能力要求对比。`;

    return callLLM([{ role: 'user', content: prompt }]);
}

// Step 3: JD推演
async function stepReasoning(data: JDFormData, analysis: string, benchmark: string): Promise<string> {
    const context = buildContext(data);
    const prompt = `你是一位资深的人力资源专家。基于前两步的分析，现在进行JD推演。

原始需求：
${context}

需求分析结果：
${analysis}

行业对标结果：
${benchmark}

请进行JD推演（直接输出推演内容，不要输出多余的开场白）：
1. **岗位定位确认**：最终确定的岗位名称和方向定位，以及为什么这样定位。
2. **职责推导**：从业务痛点和能力模型出发，推导出每一条岗位职责。每条职责都应该能回答"为什么需要这条"。
3. **要求推导**：从职责反推任职要求，确保每条要求都对应具体的职责支撑，不放空泛的要求。
4. **加分项推导**：哪些额外能力能让候选人更出色？这些加分项应该与岗位的深层需求相关。

请输出完整的推演逻辑链。`;

    return callLLM([{ role: 'user', content: prompt }]);
}

// Step 4: 最终JD输出
async function stepOutput(data: JDFormData, analysis: string, benchmark: string, reasoning: string): Promise<string> {
    const context = buildContext(data);
    const prompt = `你是一位资深的人力资源专家。基于完整的推演过程，现在输出最终的JD。

原始需求：
${context}

推演过程摘要：
${reasoning}

请直接输出最终的JD，格式严格如下（不要输出多余的开场白和结尾语，直接输出JD内容）：

**职位名称：**[最终确定的职位名称]

**岗位职责**
[每条职责独占一行，用数字编号，职责描述要具体、可衡量、与业务目标直接关联]

**任职要求**
[每条要求独占一行，用数字编号，要求要具体且与职责对应，避免空泛表述]

**加分项**
[每条加分项独占一行，用数字编号]

要求：
- 岗位职责要从高到低排列，最核心的职责放在最前面
- 每条职责要具体描述"做什么"和"达成什么效果"，不要写空话套话
- 任职要求与岗位职责严格对应，不放无法验证的软性要求
- 加分项要与岗位深层需求相关，不要放凑数的内容
- 整体语言专业精炼，体现岗位的专业性和吸引力`;

    return callLLM([{ role: 'user', content: prompt }]);
}

export async function generateJobDescription(
    data: JDFormData,
    onStepUpdate: OnStepUpdate
): Promise<string> {
    // Step 1
    onStepUpdate({ id: 'analysis', title: '需求分析', content: '' });
    const analysis = await stepAnalysis(data);
    onStepUpdate({ id: 'analysis', title: '需求分析', content: analysis });

    // Step 2
    onStepUpdate({ id: 'benchmark', title: '行业对标', content: '' });
    const benchmark = await stepBenchmark(data, analysis);
    onStepUpdate({ id: 'benchmark', title: '行业对标', content: benchmark });

    // Step 3
    onStepUpdate({ id: 'reasoning', title: 'JD推演', content: '' });
    const reasoning = await stepReasoning(data, analysis, benchmark);
    onStepUpdate({ id: 'reasoning', title: 'JD推演', content: reasoning });

    // Step 4
    onStepUpdate({ id: 'output', title: '生成JD', content: '' });
    const finalJD = await stepOutput(data, analysis, benchmark, reasoning);
    onStepUpdate({ id: 'output', title: '生成JD', content: finalJD });

    return finalJD;
}
