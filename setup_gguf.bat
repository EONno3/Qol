@echo off
echo ===================================================
echo [GGUF Engine Setup] Installing llama-cpp-python
echo ===================================================
echo This will install the CUDA-accelerated version of llama.cpp for Windows.
echo.

:: MSVC 멀티코어 컴파일 활성화
set CL=/MP
:: CMake 병렬 빌드 스레드 수 지정
set CMAKE_BUILD_PARALLEL_LEVEL=8
:: CUDA 컴파일 플래그 설정 (NVCC 자체 병렬화 및 UTF-8 전달 추가)
set CMAKE_ARGS=-DGGML_CUDA=on -DCMAKE_CXX_FLAGS="/utf-8" -DCMAKE_C_FLAGS="/utf-8" -DCMAKE_CUDA_FLAGS="--threads 8 -Xcompiler /utf-8"

.\venv\Scripts\python -m pip install llama-cpp-python --force-reinstall --no-cache-dir -v

echo.
echo ===================================================
echo Setup Complete! 
echo If you saw any red errors, let the AI know. Otherwise, you are ready to run the new script!
echo ===================================================
pause
