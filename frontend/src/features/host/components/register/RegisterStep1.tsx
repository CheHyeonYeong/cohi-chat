import { MeetingInfoForm } from '../MeetingInfoForm';

export interface Step1Data {
    topics: string[];
    description: string;
}

interface RegisterStep1Props {
    data: Step1Data;
    onChange: (data: Step1Data) => void;
    errors: Record<string, string>;
}

export const RegisterStep1 = ({ data, onChange, errors }: RegisterStep1Props) => <div className="w-full mx-auto">
    <h2 className="text-2xl md:text-3xl font-bold text-cohi-text-dark mb-2">
                기본 정보 입력
    </h2>
    <p className="text-cohi-text-dark/70 mb-8">
                게스트에게 보여질 미팅 주제와 소개를 작성해주세요.
    </p>
    <MeetingInfoForm data={data} onChange={onChange} errors={errors} />
</div>;
