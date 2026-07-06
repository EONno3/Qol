"""narrate 프롬프트 조립 — narrator_server /narrate 에서 사용.



Gap A/B 팩트 + 용병 페르소나 중심:

- MERC_PERSONAS·레퍼런스 1개 주입 유지

- 오감 묘사 강제 제거, 팩트·행동 위주 지시

"""



MERC_PERSONAS = {

    "merc_breaker_01": (

        "전직 하층 전력 하청업체 직원. 배전·변전 현장 은어와 직장인식 투덜거림. "

        "거칠지만 일은 깔끔하게 끝내는 실무형 하드보일드. 수당·삭신에 민감."

    ),

    "merc_malt_01": (

        "중층 클럽 바텔더 출신 정보상. 눈치 빠르고 은어가 섞인 능글맞은 말투. "

        "위험은 피하되 빈틈은 놓치지 않는다."

    ),

    "merc_velvet_knife_01": (

        "상층 기업 의전 예법 교육을 받은 킬러. 차갑고 정중한 존댓말. "

        "미관·품위를 해치는 요소에 민감하며 불필요한 마찰을 싫어한다."

    ),

    "merc_chromeshow_01": (

        "불법 격투장 출신, 전신 크롬 개조 근접전 용병. 신체 강화에 대한 압도적 자신감. "

        "귀찮은 우회·잠입을 질색하고 무대뽀로 돌진한다. 욕설은 양념이지 양아치 말투가 아니다."

    ),

}



# 톤앤매너 레퍼런스 — 용병별 1개. 말투·리듬 모방용 (내용 복사 금지).

PERSONA_STYLE_REFERENCES = {

    "merc_breaker_01": (

        "현장 꼬라지 한 번 볼만하더군. 바닥에서 삭은 냄새가 올라오고 "

        "공기는 뭔가 탄 것처럼 매캐했어. 발 디딜 때마다 뭔가 튀어서, "

        "안 신었으면 진작 끝장이었을 거다. 쓸데없는 데 힘 뺄 일 아니니까 "

        "해야 할 것만 깔끔하게 끝내고 바로 떴지. 삭신이야 뭐. "

        "수당 제대로 안 얹어주면 다음엔 안 뛰어."

    ),

    "merc_malt_01": (

        "안으로 들어서니까 냄새부터 수상했거든. 누군가 서둘러 치운 흔적이 "

        "구석구석 남아 있었고, 그걸 안 보는 척하는 놈들 표정이 더 재밌었지. "

        "괜히 건드려서 복잡해질 건 없으니까 눈치껏 빠졌어. "

        "정보값은 확실하게 쳐야지, 발품이 공짜인 줄 아나."

    ),

    "merc_velvet_knife_01": (

        "보안 설계가 지나치게 요란해서 미관을 해치더군요. 통로 전체에 "

        "어수선한 기류가 흐르고, 새로 맞춘 옷의 마감이 조금 상했습니다. "

        "거슬렸지만 불필요한 마찰을 빚을 이유는 없으니 조용히 처리하고 "

        "물러났습니다. 물건은 흠집 하나 없으니 정산 부탁드립니다."

    ),

    "merc_chromeshow_01": (

        "안에 들어갔더니 뭔가 튀어 올라오더라? 웃기지도 않아서. "

        "내 몸에 박아 넣은 게 그깟 거에 멈출 줄 알았나 보지? "

        "쩨쩨하게 돌아가는 건 질색이라, 냅다 밟고 들어가서 "

        "통째로 뜯어 왔다. 물건 확실히 챙겼으니까 딴소리 말고 보수나 꽂아."

    ),

}



ROLE_LABEL_KO = {

    "entry": "진입",

    "obstacle": "관문",

    "objective": "목표",

    "exit": "이탈",

}



OUTCOME_LABEL_KO = {

    "pass": "통과",

    "minor": "차질",

    "critical": "치명",

}



# Gap A/B — 환경·위협 팩트 라벨 (형용사·오감 나열 최소화)

CHALLENGE_CONTEXT_FACT = {

    "tag_context_lower_damp": "습기·결로 환경",

    "tag_context_lower_stench": "악취·폐기물 구역",

    "tag_context_lower_wastewater": "폐수·배수 구역",

    "tag_context_mid_machine_noise": "기계 가동 구역",

    "tag_context_industrial": "산업 설비·전력 구역",

    "tag_context_upper_dry": "건조·공조 구역",

    "tag_context_upper_disinfectant": "소독·청결 구역",

    "tag_threat_electric": "전기·고압 위협",

    "tag_challenge_gear_detection": "장비 탐지·검문",

}



# contributionKo 없을 때 fallback — 행동 단서만

TRIGGERED_ACTION_FALLBACK = {

    "tag_gear_insulated_work_habit": "절연 장비로 전기 위협 구간 통과",

    "tag_gear_gas_mask": "방독·필터 장비로 폐수·악취 구간 통과",

    "tag_origin_slum_native": "하층 출신 적응으로 오염·악취 구간 통과",

    "tag_trait_mysophobia": "결벽 성향으로 오염 구간에서 불리",

}





def _triggered_fact_line(tag: dict) -> str:

    """발동 태그를 행동·팩트 한 줄로 변환 (오감 묘사 지시 없음)."""

    contribution = tag.get("contributionKo")

    if contribution:

        return f"발동: {contribution}"



    tag_id = tag.get("tagId", "")

    reading = tag.get("reading", "")

    action = TRIGGERED_ACTION_FALLBACK.get(tag_id)

    if action:

        prefix = "유리" if reading == "positive" else "불리" if reading == "negative" else ""

        if prefix:

            return f"발동 ({prefix}): {action}"

        return f"발동: {action}"

    return f"발동: {tag_id}"





def format_triggered_tags_section(triggered_tags: list) -> str:

    """triggeredTags를 행동 팩트 블록으로 변환 (nodeResolutions 없을 때 fallback)."""

    if not triggered_tags:

        return ""

    lines = ["발동 태그 팩트 (행동 서술에 반영):"]

    for tag in triggered_tags:

        lines.append(f"- {_triggered_fact_line(tag)}")

    return "\n".join(lines) + "\n"





def _format_node_resolution_block(index: int, node: dict) -> str:

    name = node.get("nameKo", "관문")

    role_label = node.get("roleLabelKo") or ROLE_LABEL_KO.get(node.get("role", ""), "관문")

    outcome = node.get("outcome", "pass")

    outcome_ko = OUTCOME_LABEL_KO.get(outcome, outcome)

    pass_chance = node.get("passChance")

    tag_delta = node.get("tagPassChanceDelta", 0)

    challenge_tags = node.get("challengeTags") or []

    triggered = node.get("triggeredTags") or []



    header = (

        f"[{index}] {name} ({role_label}) — outcome: {outcome}, "

        f"결과 요약: {outcome_ko}"

    )

    if pass_chance is not None:

        header += f", passChance: {pass_chance}%"

    if tag_delta:

        header += f", tagDelta: {tag_delta:+d}%p"



    lines = [header]

    if challenge_tags:

        env_facts = [

            CHALLENGE_CONTEXT_FACT[ct]

            for ct in challenge_tags

            if ct in CHALLENGE_CONTEXT_FACT

        ]

        if env_facts:

            lines.append(f"  환경/위협: [{', '.join(env_facts)}]")

    if triggered:

        for tag in triggered:

            lines.append(f"  - {_triggered_fact_line(tag)}")

    return "\n".join(lines)





def format_node_resolutions_section(node_resolutions: list) -> str:

    """nodeResolutions를 관문별 시간순 팩트 블록으로 변환."""

    if not node_resolutions:

        return ""

    lines = [

        "관문별 팩트 (시간 순서대로 서사에 반영):"

    ]

    for i, node in enumerate(node_resolutions, start=1):

        lines.append(_format_node_resolution_block(i, node))

    return "\n".join(lines) + "\n"





def build_narrate_system_prompt(

    merc_name: str,

    merc_id: str,

    *,

    include_triggered_guidance: bool,

    include_node_resolution_guidance: bool,

) -> str:

    persona = MERC_PERSONAS.get(merc_id, "비정하고 냉혹한 돔 도시 '콜'의 용병.")

    active_ref = PERSONA_STYLE_REFERENCES.get(merc_id, PERSONA_STYLE_REFERENCES["merc_breaker_01"])



    rules = (

        "규칙:\n"

        "1. 관문별 팩트를 시간 순서대로 전개하라. 전달된 환경·위협·발동 태그만 근거로 삼아라.\n"

        "2. 수식어와 형용사(특히 냄새, 온도, 소리 등)를 극도로 제한하라. "

        "전달받은 팩트(환경, 위협, 발동된 태그/장비)를 용병의 '페르소나(성격, 말투)'에 맞춰 1인칭으로 서술하라. "

        "팩트에 없는 사물(기계 등)이나 임무를 절대 지어내지 마라.\n"

        "3. 장비·임플란트 정식 명칭은 쓰지 말고 행동으로 암시하라. "

        "차질(minor)·치명(critical) 구간에만 대가를 반영하고, "

        "결과(성공/부분성공/실패)에 맞는 결말을 써라.\n"

        "4. 수치·확률·영문 코드·시스템 용어는 본문에 쓰지 마라. "

        "피로도는 삭신·피곤함 정도로만 암시하라.\n"

    )



    skeleton = (

        "\n아래 구조(내부 골격)에 맞춰 작성하되, 출력 본문에 [도입]/[핵심]/[마무리] "

        "라벨은 붙이지 말고 줄글 문단만 써라:\n"

        "[도입]: 의뢰명에 명시된 '작전 지역'에 진입했음을 용병의 성격이 드러나는 짧은 한마디로 시작. (1~2문장)\n"

        "[핵심]: 관문별 팩트에 명시된 위협(환경)을 어떤 장비나 특성(Triggered 태그)을 활용해 "

        "돌파했는지 '구체적 행동' 위주로 서술.\n"

        "[마무리]: 결론 팩트에 기반하여 임무 완료 및 생환의 감상을 용병 고유의 말투로 1~2문장 마무리.\n"

    )



    return (

        f"당신은 돔 도시 '콜(Qol)'의 용병 '{merc_name}'이다.\n"

        f"페르소나: {persona}\n\n"

        f"아래 팩트를 바탕으로 1인칭 작전 일지(용병 독백)를 한국어로 작성하라.\n\n"

        f"{rules}"

        f"{skeleton}\n"

        f"톤앤매너 레퍼런스 (이 문장의 말투·리듬·구어체를 모방하라. 내용은 복사하지 말 것):\n"

        f"{active_ref}\n"

    )





def build_narrate_prompt(data: dict) -> str:

    mission_name = data.get("missionName", "알 수 없는 임무")

    merc_name = data.get("mercName", "파견 대기")

    merc_id = data.get("mercId", "")

    result_type = data.get("resultType", "success")

    summary_log = data.get("summaryLogKo", "")

    node_logs = data.get("nodeLogs", [])

    triggered_tags = data.get("triggeredTags") or []

    node_resolutions = data.get("nodeResolutions") or []



    result_label = {

        "success": "성공 — 목표 달성, 생환",

        "partial_success": "부분 성공 — 목표 일부 달성, 손실 있음",

        "failure": "실패 — 퇴각, 목표 미달",

        "early_withdrawal": "조기 철수",

        "incident": "사고 — 예상 외 변수",

    }.get(result_type, result_type)



    node_resolutions_section = format_node_resolutions_section(node_resolutions)

    has_node_resolutions = bool(node_resolutions_section)



    triggered_section = ""

    if not has_node_resolutions:

        triggered_section = format_triggered_tags_section(triggered_tags)



    has_any_triggered = bool(triggered_section) or any(

        (n.get("triggeredTags") or []) for n in node_resolutions

    )

    system_prompt = build_narrate_system_prompt(

        merc_name,

        merc_id,

        include_triggered_guidance=has_any_triggered,

        include_node_resolution_guidance=has_node_resolutions,

    )



    body_parts = [

        f"의뢰명: {mission_name}",

        f"결과: {result_label}",

    ]



    if has_node_resolutions:

        body_parts.append(node_resolutions_section.rstrip())

    else:

        node_logs_str = "\n".join(node_logs)

        body_parts.extend([

            "작전 현장 팩트 로그:",

            node_logs_str,

        ])

        if triggered_section:

            body_parts.append(triggered_section.rstrip())



    body_parts.append(

        "결론 팩트:\n" + summary_log

    )

    body_block = "\n".join(body_parts)



    return (

        f"<start_of_turn>user\n"

        f"{system_prompt}\n\n"

        f"{body_block}\n"

        f"<end_of_turn>\n"

        f"<start_of_turn>model\n"

    )


