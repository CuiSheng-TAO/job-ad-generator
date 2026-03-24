'use client';

import { useState, useRef, useCallback } from 'react';
import { generateJobDescription, GenerationStep, JDFormData } from '../utils/openai';
import { Toaster, toast } from 'react-hot-toast';

const STEP_META: Record<string, { label: string; desc: string }> = {
    analysis: { label: '需求分析', desc: '深入分析岗位本质、能力模型与人才画像' },
    benchmark: { label: '行业对标', desc: '对标行业头部公司的类似岗位设置' },
    reasoning: { label: 'JD推演', desc: '从痛点出发推导职责、要求与加分项' },
    output: { label: '输出JD', desc: '输出结构化JD' },
};

const STEPS_ORDER = ['analysis', 'benchmark', 'reasoning', 'output'] as const;

export default function Home() {
    const [loading, setLoading] = useState(false);
    const [steps, setSteps] = useState<GenerationStep[]>([]);
    const [viewingStepId, setViewingStepId] = useState<string | null>(null);
    const [finalJD, setFinalJD] = useState('');
    // Track which step is currently being generated
    const currentGeneratingStepRef = useRef<string | null>(null);
    // Track if user has manually selected a step
    const userSelectedRef = useRef(false);

    const [formData, setFormData] = useState<JDFormData>({
        jobTitle: '',
        industry: '',
        companyProfile: '',
        keyWords: '',
        painPoints: '',
        teamStatus: '',
        referenceCompanies: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleStepClick = useCallback((stepId: string) => {
        userSelectedRef.current = true;
        setViewingStepId(stepId);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSteps([]);
        setFinalJD('');
        setViewingStepId('analysis');
        userSelectedRef.current = false;
        currentGeneratingStepRef.current = 'analysis';

        try {
            const jd = await generateJobDescription(formData, (step) => {
                setSteps((prev) => {
                    const existing = prev.findIndex((s) => s.id === step.id);
                    if (existing >= 0) {
                        const updated = [...prev];
                        updated[existing] = step;
                        return updated;
                    }
                    return [...prev, step];
                });

                currentGeneratingStepRef.current = step.done ? null : step.id;

                // Auto-switch to new step only if user hasn't manually selected
                if (!userSelectedRef.current) {
                    setViewingStepId(step.id);
                }

                // When a step completes, if user is viewing it, auto-advance to next
                if (step.done) {
                    const idx = STEPS_ORDER.indexOf(step.id as typeof STEPS_ORDER[number]);
                    if (idx < STEPS_ORDER.length - 1) {
                        const nextId = STEPS_ORDER[idx + 1];
                        if (!userSelectedRef.current) {
                            setViewingStepId(nextId);
                        }
                        currentGeneratingStepRef.current = nextId;
                    }
                    // Reset user selection when a new step starts
                    // so auto-follow resumes for the next step
                    if (!userSelectedRef.current) {
                        userSelectedRef.current = false;
                    }
                }
            });
            setFinalJD(jd || '');
            setViewingStepId('output');
            userSelectedRef.current = false;
            toast.success('JD生成完成！');
        } catch (error) {
            toast.error('生成出错，请检查网络后重试');
            console.error(error);
        } finally {
            setLoading(false);
            currentGeneratingStepRef.current = null;
        }
    };

    const viewingStep = steps.find((s) => s.id === viewingStepId) || null;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-10 px-4 bg-[#fdfaf3]">
            <Toaster position="top-center" />

            <main className="flex flex-col items-center w-full max-w-7xl">
                <h1 className="text-5xl font-bold text-stone-800 mb-2 font-kaiti">
                    招聘广告<span className="text-[#b3a08d]">生成器</span>
                </h1>
                <p className="text-xl text-stone-600 mb-10 font-serif italic">
                    AI-Powered Job Description Reasoning Engine
                </p>

                <div className="w-full bg-white shadow-xl rounded-2xl overflow-hidden border border-stone-100">
                    <div className="grid grid-cols-1 lg:grid-cols-3">

                        {/* Left Column: Input Form - no scroll, full height */}
                        <div className="p-6 bg-[#f7f1e6] border-r border-stone-100 lg:col-span-1">
                            <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center">
                                <span className="mr-2 text-lg">&#9998;</span> 岗位信息
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-3">

                                <FormField
                                    label="职位名称"
                                    required
                                    importance="high"
                                    hint="将直接决定JD的方向和定位"
                                >
                                    <input
                                        type="text"
                                        name="jobTitle"
                                        value={formData.jobTitle}
                                        onChange={handleChange}
                                        placeholder="例如：运营专家、高级前端工程师"
                                        className="form-input"
                                        required
                                    />
                                </FormField>

                                <FormField
                                    label="所属行业/公司"
                                    required
                                    importance="high"
                                    hint="帮助AI进行精准的行业对标分析"
                                >
                                    <input
                                        type="text"
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleChange}
                                        placeholder="例如：AI SaaS公司、互联网教育"
                                        className="form-input"
                                        required
                                    />
                                </FormField>

                                <FormField
                                    label="业务痛点 / 招聘背景"
                                    importance="high"
                                    hint="核心输入 - 直接影响JD职责的针对性"
                                >
                                    <textarea
                                        name="painPoints"
                                        value={formData.painPoints}
                                        onChange={handleChange}
                                        placeholder="例如：运营能力薄弱，用户付费率和留存率偏低；客服体系缺失，大客户服务跟不上..."
                                        rows={2}
                                        className="form-input resize-none"
                                    />
                                </FormField>

                                <FormField
                                    label="团队现状"
                                    importance="medium"
                                    hint="帮助推导岗位需要补充的能力缺口"
                                >
                                    <textarea
                                        name="teamStatus"
                                        value={formData.teamStatus}
                                        onChange={handleChange}
                                        placeholder="例如：目前PM兼顾运营，无专职运营人员；研发团队10人，缺少用户侧支持..."
                                        rows={2}
                                        className="form-input resize-none"
                                    />
                                </FormField>

                                <FormField
                                    label="核心技能 / 关键词"
                                    importance="medium"
                                    hint="指定你期望的关键能力和经验标签"
                                >
                                    <textarea
                                        name="keyWords"
                                        value={formData.keyWords}
                                        onChange={handleChange}
                                        placeholder="例如：用户成功、SOP搭建、数据分析、跨团队协同..."
                                        rows={2}
                                        className="form-input resize-none"
                                    />
                                </FormField>

                                <FormField
                                    label="参考对标公司"
                                    importance="low"
                                    hint="指定后AI会重点分析这些公司的岗位设置"
                                >
                                    <input
                                        type="text"
                                        name="referenceCompanies"
                                        value={formData.referenceCompanies}
                                        onChange={handleChange}
                                        placeholder="例如：Anthropic, OpenAI, Notion, 字节跳动"
                                        className="form-input"
                                    />
                                </FormField>

                                <FormField
                                    label="公司简介"
                                    importance="low"
                                    hint="提供公司背景信息，让JD更贴合实际"
                                >
                                    <textarea
                                        name="companyProfile"
                                        value={formData.companyProfile}
                                        onChange={handleChange}
                                        placeholder="简要描述公司的业务方向、产品阶段、团队规模..."
                                        rows={2}
                                        className="form-input resize-none"
                                    />
                                </FormField>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-6 bg-[#b3a08d] hover:bg-[#a3907d] text-white font-bold text-base rounded-xl shadow-lg transform transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            推演中...
                                        </span>
                                    ) : (
                                        '开始推演'
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Right Column: relative container, absolute inner for scroll */}
                        <div className="lg:col-span-2 relative">
                        <div className="lg:absolute lg:inset-0 p-6 bg-white flex flex-col overflow-hidden">

                            {/* Step Progress Bar */}
                            {(steps.length > 0 || loading) && (
                                <div className="flex items-center mb-6 gap-2 flex-shrink-0">
                                    {STEPS_ORDER.map((stepId, idx) => {
                                        const step = steps.find((s) => s.id === stepId);
                                        const isDone = step?.done;
                                        const isGenerating = currentGeneratingStepRef.current === stepId && !isDone;
                                        const isViewing = viewingStepId === stepId;
                                        const hasContent = !!step?.content;
                                        const meta = STEP_META[stepId];
                                        return (
                                            <div key={stepId} className="flex items-center flex-1">
                                                <button
                                                    onClick={() => { if (hasContent) handleStepClick(stepId); }}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full
                                                        ${isViewing ? 'bg-[#b3a08d] text-white shadow-md' : ''}
                                                        ${hasContent && !isViewing ? 'bg-stone-100 text-stone-700 hover:bg-stone-200 cursor-pointer' : ''}
                                                        ${!hasContent && !isViewing ? 'bg-stone-50 text-stone-300' : ''}
                                                    `}
                                                    disabled={!hasContent}
                                                >
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                                                        ${isDone ? 'bg-green-500 text-white' : ''}
                                                        ${isGenerating ? 'bg-[#b3a08d] text-white animate-pulse' : ''}
                                                        ${!isDone && !isGenerating ? 'bg-stone-200 text-stone-400' : ''}
                                                    `}>
                                                        {isDone ? '\u2713' : idx + 1}
                                                    </span>
                                                    <span>{meta.label}</span>
                                                </button>
                                                {idx < STEPS_ORDER.length - 1 && (
                                                    <div className={`w-4 h-0.5 flex-shrink-0 ${isDone ? 'bg-green-300' : 'bg-stone-200'}`} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Content Area - scrollable */}
                            <div className="flex-1 bg-[#fdfaf3] border border-stone-200 rounded-xl shadow-inner flex flex-col min-h-0 overflow-hidden">
                                {steps.length === 0 && !loading ? (
                                    <div className="h-full w-full flex flex-col items-center justify-center text-stone-400 p-8">
                                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                        </svg>
                                        <p className="text-lg mb-2">填写岗位信息，开始AI推演</p>
                                        <p className="text-sm text-stone-300">AI将通过 需求分析 &rarr; 行业对标 &rarr; JD推演 &rarr; 最终输出 四个步骤生成高质量JD</p>
                                    </div>
                                ) : viewingStep ? (
                                    <div className="flex flex-col h-full min-h-0">
                                        <div className="px-6 py-4 border-b border-stone-200 bg-white/50 flex items-center justify-between flex-shrink-0">
                                            <div>
                                                <h3 className="font-bold text-stone-800 text-lg">
                                                    {viewingStep.title}
                                                </h3>
                                                <p className="text-sm text-stone-400">{STEP_META[viewingStep.id]?.desc}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {viewingStep.done && viewingStep.id !== 'output' && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">已完成</span>
                                                )}
                                                {!viewingStep.done && viewingStep.content && (
                                                    <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full flex items-center gap-1">
                                                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        生成中
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6 min-h-0 scrollbar-visible">
                                            {viewingStep.content ? (
                                                viewingStep.id === 'output' && viewingStep.done ? (
                                                    <textarea
                                                        value={finalJD}
                                                        onChange={(e) => setFinalJD(e.target.value)}
                                                        className="w-full h-full bg-transparent text-stone-800 leading-relaxed text-[15px] resize-none focus:outline-none"
                                                    />
                                                ) : (
                                                    <div className="text-stone-800 leading-relaxed whitespace-pre-wrap text-[15px]">
                                                        {viewingStep.content}
                                                    </div>
                                                )
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-stone-400">
                                                    <div className="animate-float-breathing">
                                                        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                                        </svg>
                                                    </div>
                                                    <p>正在{viewingStep.title}...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Copy Button for final JD */}
                            {finalJD && (
                                <div className="mt-4 flex gap-3 flex-shrink-0">
                                    <button
                                        onClick={() => { document.querySelector('form')?.requestSubmit(); }}
                                        className="flex-1 py-3 bg-[#b3a08d] hover:bg-[#a3907d] text-white font-medium rounded-lg transition-colors"
                                    >
                                        重新生成
                                    </button>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(finalJD); toast.success("已复制到剪贴板"); }}
                                        className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-lg transition-colors border border-stone-300"
                                    >
                                        复制JD内容
                                    </button>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
                </div>

                <footer className="mt-12 text-stone-500 font-serif text-sm">
                    powered by Claude code
                </footer>
            </main>
        </div>
    );
}

function FormField({ label, required, importance, hint, children }: {
    label: string;
    required?: boolean;
    importance: 'high' | 'medium' | 'low';
    hint: string;
    children: React.ReactNode;
}) {
    const badges: Record<string, { text: string; color: string }> = {
        high: { text: '重要', color: 'bg-red-100 text-red-600' },
        medium: { text: '推荐', color: 'bg-amber-100 text-amber-600' },
        low: { text: '可选', color: 'bg-stone-100 text-stone-500' },
    };
    const badge = badges[importance];

    return (
        <div>
            <label className="flex items-center gap-2 text-base font-medium text-slate-800 mb-1.5">
                {label}
                {required && <span className="text-red-400">*</span>}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${badge.color}`}>{badge.text}</span>
            </label>
            <p className="text-xs text-stone-400 mb-1.5">{hint}</p>
            {children}
        </div>
    );
}
