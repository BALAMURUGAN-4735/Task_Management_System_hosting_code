# Build Stage using official Eclipse Temurin JDK 21
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Maven install
RUN apt-get update && apt-get install -y maven

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]