<?php

declare(strict_types=1);

namespace OCA\CloudChess\Tests;

use CurlHandle;
use RuntimeException;

final class HttpClient
{
    private CurlHandle $curl;
    private string $token;
    private string $base;

    public function __construct(string $user, string $password)
    {
        $this->base = rtrim(getenv('CLOUD_CHESS_URL') ?: 'http://localhost:8080', '/');
        $this->curl = curl_init();
        curl_setopt_array($this->curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_COOKIEFILE => '',
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 30,
        ]);
        // Docker reaches Nginx via its service name while preserving the trusted localhost URL.
        if ($connectTo = getenv('CLOUD_CHESS_HTTP_CONNECT_TO')) {
            curl_setopt($this->curl, CURLOPT_CONNECT_TO, [$connectTo]);
        }
        $page = $this->send('/login')[1];
        $token = $this->readToken($page, 'data-requesttoken');
        $this->send('/login', http_build_query([
            'user' => $user,
            'password' => $password,
            'requesttoken' => $token,
        ]), ['Content-Type: application/x-www-form-urlencoded', 'Origin: ' . $this->base]);
        $page = $this->send('/index.php/apps/cloud_chess/')[1];
        $this->token = $this->readToken($page, 'data-request-token');
    }

    public function request(string $path, ?array $body = null, bool $csrf = true): array
    {
        $headers = ['Accept: application/json'];
        if ($body !== null) {
            $headers[] = 'Content-Type: application/json';
            if ($csrf) {
                $headers[] = 'requesttoken: ' . $this->token;
            }
        }
        [$status, $payload] = $this->send(
            '/index.php/apps/cloud_chess/api' . $path,
            $body === null ? null : json_encode($body, JSON_THROW_ON_ERROR),
            $headers,
        );

        return [$status, json_decode($payload, true) ?? $payload];
    }

    private function send(string $path, ?string $body = null, array $headers = []): array
    {
        curl_setopt_array($this->curl, [
            CURLOPT_URL => $this->base . $path,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPGET => $body === null,
            CURLOPT_POST => $body !== null,
        ]);
        $response = curl_exec($this->curl);
        if ($response === false) {
            throw new RuntimeException('HTTP request failed: ' . curl_error($this->curl));
        }

        return [curl_getinfo($this->curl, CURLINFO_RESPONSE_CODE), $response];
    }

    private function readToken(string $page, string $attribute): string
    {
        if (!preg_match('/' . $attribute . '="([^"]+)"/', $page, $match)) {
            throw new RuntimeException('Login did not reach the expected Nextcloud page.');
        }

        return html_entity_decode($match[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}
