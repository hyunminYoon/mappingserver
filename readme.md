# Mapping Server For Edge
Edge서버의 데이터를 원하는데로 출력하기 위한 API 서버

## 설치
git clone으로 다운로드 후

### 필요한 패키지 설치
```
npm install
```

### 프로세스 관리
```
npm install -g pm2
```

pm2(process manager)를 이용해서 관리.

### 서버 시작
기본 방법
```
npm start
```

pm2방법
```
pm2 start index.js --name mapping_server
```

실행 이후 pm2의 명령어로 제어할 수 있으며 무중단 서비스가 가능.
(서비스 데몬 방식도 지원)