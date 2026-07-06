import sys
import torch
from transformers import AutoProcessor, AutoModelForMultimodalLM

# Windows 터미널에서 한글 깨짐 방지
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_text.py <model_path>")
        sys.exit(1)

    model_path = sys.argv[1]
    
    print(f"Loading model from: {model_path}")
    
    # 1. 토크나이저 및 모델 로드
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    
    try:
        processor = AutoProcessor.from_pretrained(model_path, local_files_only=True)
        model = AutoModelForMultimodalLM.from_pretrained(
            model_path,
            local_files_only=True,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            device_map="auto" if device == "cuda" else None
        )
        if device == "cpu":
            model.to("cpu")
    except Exception as e:
        print(f"Failed to load model: {e}")
        sys.exit(1)
        
    print("Model loaded successfully.")
    
    # 2. 테스트용 프롬프트 세팅
    system_prompt = "당신은 거대 돔 도시 '콜(Qol)'의 냉혹한 픽서입니다. 주어진 의뢰 정보를 바탕으로, 파견될 용병들이 읽을 짧고 건조한 3문장짜리 작전 브리핑을 한국어로 작성하세요."
    mission_tags = "[목표: 불법 데이터 탈취, 환경: 고압 전류 위험, 보안: 메가코프 특수경비대]"
    
    messages = [
        {"role": "user", "content": f"{system_prompt}\n\n의뢰 정보: {mission_tags}"}
    ]
    
    print("Generating text...\n")
    
    # 3. 템플릿 적용 및 생성
    try:
        inputs = processor.apply_chat_template(
            messages, 
            tokenize=True, 
            return_dict=True,
            add_generation_prompt=True, 
            return_tensors="pt"
        ).to(model.device)
        input_len = inputs["input_ids"].shape[-1]
    except Exception as e:
        print(f"apply_chat_template fallback: {e}")
        prompt = f"Instruction: {system_prompt}\nInput: {mission_tags}\nResponse: "
        inputs = processor(text=prompt, return_tensors="pt").to(model.device)
        input_len = inputs["input_ids"].shape[-1]

    outputs = model.generate(
        **inputs,
        max_new_tokens=150,
        do_sample=True,
        temperature=0.7,
        top_p=0.9
    )
    
    response = processor.decode(outputs[0][input_len:], skip_special_tokens=True)
    
    print("\n================ [생성 결과] ================\n")
    print(response.strip())
    print("\n=============================================\n")

if __name__ == "__main__":
    main()
